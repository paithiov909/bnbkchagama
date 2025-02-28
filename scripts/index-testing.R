dat <- arrow::read_parquet("scripts/gbf-title-emb.parquet")

# pri <- prcomp(jvcoords::whiten(dat[, -1])$y, center = TRUE, scale. = TRUE)
pri <- prcomp(dat[, -1], center = TRUE, scale. = TRUE)
predict(pri, as.matrix(dat[1, -1])) |> str()

library(RcppHNSW)
idx <- hnsw_build(pri$x[, 1:50], distance = "l2", M = 24, ef = 100)
suggestions <- hnsw_search(matrix(pri$x[452, 1:50], nrow = 1), idx, k = 12)

dat[452, "title"]
dat[as.integer(suggestions[["idx"]]), "title"]
