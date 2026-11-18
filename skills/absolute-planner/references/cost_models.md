# Cloud Infrastructure Cost Estimation and FinOps Reference

Use these exact price matrices and cost formulas to calculate monthly hosting and operations costs for systems.

## AWS Cost Models (Monthly)

### 1. Compute Services

#### Amazon EC2 (On-Demand Linux, US East)
- **t3.medium** (2 vCPU, 4 GiB RAM): `$30.37` (`$0.0416/hr`)
- **m6g.large** (2 vCPU, 8 GiB RAM - ARM): `$56.21` (`$0.077/hr`)
- **m6g.xlarge** (4 vCPU, 16 GiB RAM - ARM): `$112.42` (`$0.154/hr`)
- **c6g.2xlarge** (8 vCPU, 16 GiB RAM - Compute): `$201.48` (`$0.276/hr`)
- **r6g.2xlarge** (8 vCPU, 64 GiB RAM - Memory): `$353.32` (`$0.484/hr`)

#### AWS Fargate (ECS/EKS Serverless Compute)
- **per vCPU**: `$29.56` (`$0.04048/hr`)
- **per GiB RAM**: `$3.24` (`$0.004445/hr`)
- *Formula*: `(vCPU * 29.56 + RAM_GB * 3.24) * Instances`

#### AWS Lambda (Serverless Functions)
- **Requests**: `$0.20` per 1 Million requests
- **Duration**: `$0.0000166667` per GB-second (1024MB RAM allocated for 1 second = 1 GB-second)
- *Formula*: `(Requests_M * 0.20) + (Requests * Avg_Duration_Sec * (RAM_MB / 1024) * 0.0000166667)`

### 2. Database Services

#### Amazon RDS (PostgreSQL, Multi-AZ for High Availability)
- **db.t3.medium** (2 vCPU, 4 GiB RAM): `$60.74` (`$0.0832/hr`) -> Multi-AZ: `$121.48`
- **db.m6g.large** (2 vCPU, 8 GiB RAM): `$105.12` (`$0.144/hr`) -> Multi-AZ: `$210.24`
- **db.m6g.xlarge** (4 vCPU, 16 GiB RAM): `$210.24` (`$0.288/hr`) -> Multi-AZ: `$420.48`
- **db.r6g.2xlarge** (8 vCPU, 64 GiB RAM): `$645.32` (`$0.884/hr`) -> Multi-AZ: `$1,290.64`
- **EBS Storage (gp3)**: `$0.115` per GB-month (Multi-AZ: `$0.23` per GB-month)
- **Provisioned IOPS (gp3)**: `$0.008` per IOPS-month (Multi-AZ: `$0.016`)

#### Amazon DynamoDB (NoSQL)
- **Write Request Units (WRU)**: `$1.25` per 1 Million writes (1 WRU = 1 KB write)
- **Read Request Units (RRU)**: `$0.25` per 1 Million reads (1 RRU = 4 KB strongly consistent read or 2 x 4 KB eventually consistent reads)
- **Data Storage**: `$0.25` per GB-month
- *Formula*: `(Writes_M * 1.25) + (Reads_M * 0.25) + (Storage_GB * 0.25)`

#### Amazon ElastiCache (Redis, Replication Group with 1 Primary + 1 Replica)
- **cache.t3.medium** (2 vCPU, 3 GiB RAM): `$30.37 * 2 = $60.74`
- **cache.m6g.large** (2 vCPU, 6.3 GiB RAM): `$63.51 * 2 = $127.02`
- **cache.r6g.xlarge** (4 vCPU, 26 GiB RAM): `$237.98 * 2 = $475.96`

### 3. Storage and Delivery

#### Amazon S3 (Simple Storage Service)
- **Standard Storage**: `$0.023` per GB-month (first 50 TB)
- **PUT, COPY, POST, LIST Requests**: `$0.005` per 1,000 requests
- **GET, SELECT, and all other Requests**: `$0.0004` per 1,000 requests

#### Amazon CloudFront (CDN)
- **Data Transfer Out to Internet**: `$0.085` per GB (first 10 TB)
- **HTTPS Requests**: `$0.010` per 10,000 requests

### 4. Networking and Load Balancing

#### AWS Application Load Balancer (ALB)
- **ALB Instance**: `$16.24` per month (`$0.02225/hr`)
- **LCU (Load Balancer Capacity Units)**: `$5.84` per LCU-month (`$0.008/hr` per LCU - measures connections, active connections, bandwidth, and rule evaluations)
- *Average Production ALB Cost*: `~$25 - $50` per month

#### Data Transfer Out (Egress to Internet)
- **0 - 100 GB/month**: Free
- **100 GB - 10 TB/month**: `$0.09` per GB
- **10 TB - 40 TB/month**: `$0.085` per GB

---

## GCP Cost Models (Monthly)

### 1. Google Compute Engine (GCE)
- **e2-medium** (2 vCPU, 4 GiB RAM): `$24.51`
- **n2-standard-4** (4 vCPU, 16 GiB RAM): `$97.46`
- **Persistent Disk (SSD)**: `$0.17` per GB-month

### 2. Google Cloud Run (Serverless Container)
- **vCPU-second**: `$0.000024`
- **RAM-second**: `$0.0000025`
- **Requests**: `$0.40` per 1 Million requests

### 3. Google Cloud SQL (PostgreSQL, Highly Available)
- **db-custom-2-7680** (2 vCPU, 7.5 GiB RAM HA): `$152.40`
- **db-custom-4-15360** (4 vCPU, 15 GiB RAM HA): `$304.80`
- **SSD Storage**: `$0.34` per GB-month

---

## Cost Scaling Multipliers

Use this table to forecast costs at different user scales. Show all calculations in the final FinOps report.

| User Scale | Active Users (MAU) | Estimated Peak Concurrency | Storage Growth Rate | Network Egress |
|---|---|---|---|---|
| **100** | 100 | < 5 | Negligible (< 1 GB/mo) | < 10 GB/mo |
| **1,000** | 1,000 | 10 - 25 | 1 - 5 GB/mo | 50 - 100 GB/mo |
| **10,000** | 10,000 | 100 - 250 | 10 - 50 GB/mo | 500 GB - 1 TB/mo |
| **100,000** | 100,000 | 1,000 - 2,500 | 100 - 500 GB/mo | 5 - 10 TB/mo |
| **1,000,000** | 1,000,000 | 10,000 - 25,000 | 1 - 5 TB/mo | 50 - 100 TB/mo |
