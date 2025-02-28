# For testing
# model_path <- hfhub::hub_download(
#   "bartowski/granite-embedding-107m-multilingual-GGUF",
#   "granite-embedding-107m-multilingual-f16.gguf"
# )

# For production
# https://huggingface.co/Snowflake/snowflake-arctic-embed-l-v2.0
model_path <- hfhub::hub_download(
  "Casual-Autopsy/snowflake-arctic-embed-l-v2.0-gguf",
  "snowflake-arctic-embed-l-v2.0-q8_0.gguf"
)

server <- processx::process$new(
  "llama-server",
  args = c(
    "-m", model_path,
    "--embedding",
    "--pooling", "mean",
    "--port", "8080"
  )
)

dat <- readr::read_csv("scripts/gbf-title.csv")
titles <- stringi::stri_trans_nfkc(dat$`称号名`)
temp_csv <- tempfile(fileext = ".csv")

resp <- httr::GET("http://127.0.0.1:8080/v1/models")

if (httr::status_code(resp) == 200) {
  id <-
    httr::content(resp) |>
    purrr::pluck("data", 1, "id")

  get_embedding <- \(input, model = id) {
    resp <-
      httr::POST(
        url = "http://127.0.0.1:8080/v1/embeddings",
        body = list(
          input = input,
          model = id
        ),
        encode = "json"
      )
    if (httr::status_code(resp) != 200) {
      rlang::warn(sprintf("Failed to get embedding: %s", input))
      return(NA_real_)
    }
    emb <-
      httr::content(resp) |>
      purrr::pluck("data", 1, "embedding") |>
      purrr::list_transpose() |> # list of doubles
      unlist(use.names = FALSE)
    emb
  }

  purrr::iwalk(titles, \(x, i) {
    emb <- get_embedding(x)
    readr::write_lines(toString(emb), temp_csv, append = TRUE)
  }, .progress = TRUE)
}

try(server$kill(), silent = TRUE)

dat <-
  readr::read_csv(temp_csv, col_names = FALSE) |>
  dplyr::mutate(title = titles) |>
  dplyr::relocate(title, dplyr::everything())

# 3079 x 1024 + 'title' column
arrow::write_parquet(dat, "scripts/gbf-title-emb.parquet")
# saveRDS(dat, "scripts/gbf-title-emb.rds")
