# dat <- readRDS("scripts/gbf-title-emb.rds")
dat <- arrow::read_parquet("scripts/gbf-title-emb.parquet")

n <- nrow(dat)
mat <- as.matrix(dat[1:n, -1]) |> as.double()

jsonlite::write_json(mat, "src/data/embedding.json", digits = 4)
jsonlite::write_json(dat[1:n, 1], "src/data/labels.json")
