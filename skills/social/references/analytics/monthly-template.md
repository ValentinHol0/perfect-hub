# Monthly review template and data columns

## 1. Monthly review (`deliverables/social/<slug>/review-<yyyy-mm>.md`)
```markdown
# Соцмережі <Бренд>: підсумки за <місяць рік>

## Підсумок (3 речення)
Що виросло, що впало, що робимо далі.

## KPI vs ціль
| KPI | Ціль | Факт | Зміна до минулого місяця | Коментар |
|---|---|---|---|---|

## Платформи
| Платформа | Публікацій | Охоплення | Перегляди | ER (pooled) | Збереження | Поширення | Кліки | Підписники ± |
|---|---|---|---|---|---|---|---|---|

## Рубрики і формати (вивід metrics.mjs)
<таблиця --by pillar> · <таблиця --by format>

## Топ-3 і антитоп-3
| Пост | Платформа | Формат | ER | Чому спрацював / не спрацював (гіпотеза) |
|---|---|---|---|---|

## Спільнота
Коментарі й Direct: кількість, теми, середній час відповіді; негатив: кейси і як вирішено.

## Експерименти
| Гіпотеза | Зміна | Метрика | Результат | Рішення |
|---|---|---|---|---|

## Рішення на наступний місяць
1. …

## Методика
Метрики: назви з нативної аналітики (дата вивантаження). ER = (вподобання + коментарі + поширення + збереження) / охоплення. ERR = перегляди / підписники. Що не перевірено: [Unverified] …
```

## 2. Post-level CSV for `metrics.mjs`
```
id,date,platform,pillar,format,reach,views,likes,comments,shares,saves,clicks,followers
reel-2026-11-03,2026-11-03,instagram,Користь,reel,12400,18950,610,48,95,212,31,
tg-2026-11-04,2026-11-04,telegram,Продукт,post,,3120,85,12,40,,,5200
```
- One row per post; `date` as YYYY-MM-DD; `platform` lowercase.
- Leave a cell empty when the platform does not report the metric (do not write 0).
- `followers` = followers/subscribers at posting time (needed for ERR).
- Semicolon-separated files from Excel work as is; keep the header names in English.
- Example numbers above illustrate the format only.
