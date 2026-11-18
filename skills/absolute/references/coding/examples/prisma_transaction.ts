import { createHash } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/*
 * Reference standard: idempotent order creation with race-free stock decrement.
 *
 * Assumed schema (Prisma):
 *   model IdempotencyRecord { key String @id  requestHash String  response String?  createdAt DateTime @default(now()) }
 *   model Product { id String @id  name String  price Int  stock Int }          // price in minor units (kopiyky/cents)
 *   model Order   { id String @id @default(cuid())  userId String  totalAmount Int  status String  items OrderItem[] }
 *
 * Guarantees (each backed by a database constraint, not by read-then-write):
 * 1. Idempotency: the key is CLAIMED by an insert under the primary-key constraint inside the transaction.
 *    A concurrent duplicate blocks on that row, then fails with P2002 and is answered from the stored record.
 *    Reusing a key with a different payload is rejected (422) instead of silently returning the old result.
 * 2. Stock: each decrement is conditional (`stock >= qty`) in a single UPDATE, so two concurrent orders
 *    can never drive stock below zero. Rows are touched in sorted id order to keep lock order deterministic.
 * 3. Any failure rolls back the whole transaction, including the idempotency claim.
 */

interface OrderItemInput { productId: string; quantity: number }
interface CreateOrderBody { userId: string; items: OrderItemInput[] }

class OrderError extends Error {
  constructor(readonly status: number, message: string) { super(message); }
}

function parseBody(body: unknown): CreateOrderBody {
  const b = body as Partial<CreateOrderBody> | null;
  if (!b || typeof b.userId !== 'string' || !Array.isArray(b.items) || b.items.length === 0 || b.items.length > 100) {
    throw new OrderError(400, 'Body must contain userId and 1–100 items');
  }
  const seen = new Set<string>();
  for (const i of b.items) {
    if (typeof i?.productId !== 'string' || !Number.isInteger(i.quantity) || i.quantity < 1 || i.quantity > 1000) {
      throw new OrderError(400, 'Each item needs productId and an integer quantity 1–1000');
    }
    if (seen.has(i.productId)) throw new OrderError(400, `Duplicate productId ${i.productId}`);
    seen.add(i.productId);
  }
  return { userId: b.userId, items: b.items as OrderItemInput[] };
}

const hashRequest = (body: CreateOrderBody) =>
  createHash('sha256')
    .update(JSON.stringify({ userId: body.userId, items: [...body.items].sort((a, b) => a.productId.localeCompare(b.productId)) }))
    .digest('hex');

const isUniqueViolation = (e: unknown) => e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002';

export async function createOrderController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const key = req.get('Idempotency-Key');
    if (!key || key.length > 128) throw new OrderError(400, 'Idempotency-Key header (≤128 chars) is required');
    const body = parseBody(req.body);
    const requestHash = hashRequest(body);

    try {
      const response = await prisma.$transaction(async (tx) => {
        await tx.idempotencyRecord.create({ data: { key, requestHash } }); // claim first; duplicates fail here

        const items = [...body.items].sort((a, b) => a.productId.localeCompare(b.productId));
        const products = await tx.product.findMany({ where: { id: { in: items.map((i) => i.productId) } } });
        const byId = new Map(products.map((p) => [p.id, p]));

        let totalAmount = 0;
        for (const item of items) {
          const product = byId.get(item.productId);
          if (!product) throw new OrderError(404, `Product ${item.productId} not found`);
          const { count } = await tx.product.updateMany({
            where: { id: item.productId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });
          if (count !== 1) throw new OrderError(409, `Insufficient stock for ${product.name}`);
          totalAmount += product.price * item.quantity;
        }

        const order = await tx.order.create({
          data: {
            userId: body.userId,
            totalAmount,
            status: 'PENDING_PAYMENT',
            items: { create: items.map((i) => ({ productId: i.productId, quantity: i.quantity, price: byId.get(i.productId)!.price })) },
          },
        });

        const result = { orderId: order.id, totalAmount, status: order.status };
        await tx.idempotencyRecord.update({ where: { key }, data: { response: JSON.stringify(result) } });
        return result;
      });
      res.status(201).json(response);
    } catch (e) {
      if (!isUniqueViolation(e)) throw e;
      const existing = await prisma.idempotencyRecord.findUnique({ where: { key } });
      if (!existing) throw e;
      if (existing.requestHash !== requestHash) throw new OrderError(422, 'Idempotency-Key was already used with a different request');
      if (!existing.response) throw new OrderError(409, 'A request with this Idempotency-Key is still in progress');
      res.setHeader('Idempotent-Replayed', 'true');
      res.status(201).json(JSON.parse(existing.response));
    }
  } catch (e) {
    if (e instanceof OrderError) {
      res.status(e.status).json({ error: e.message });
      return;
    }
    next(e);
  }
}
