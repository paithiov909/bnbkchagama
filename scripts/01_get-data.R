# https://gbf-wiki.com/index.php?%E7%A7%B0%E5%8F%B7%E4%B8%80%E8%A6%A7
pages <-
  c(
    story = "https://gbf-wiki.com/index.php?%E7%A7%B0%E5%8F%B7%E4%B8%80%E8%A6%A7/%E3%82%B9%E3%83%88%E3%83%BC%E3%83%AA%E3%83%BC%E7%B3%BB",
    battle = "https://gbf-wiki.com/index.php?%E7%A7%B0%E5%8F%B7%E4%B8%80%E8%A6%A7/%E3%83%90%E3%83%88%E3%83%AB%E7%B3%BB",
    crop = "https://gbf-wiki.com/index.php?%E7%A7%B0%E5%8F%B7%E4%B8%80%E8%A6%A7/%E5%8F%8E%E9%9B%86%E7%B3%BB",
    ability = "https://gbf-wiki.com/index.php?%E7%A7%B0%E5%8F%B7%E4%B8%80%E8%A6%A7/%E8%83%BD%E5%8A%9B%E7%B3%BB",
    team_battle = "https://gbf-wiki.com/index.php?%E7%A7%B0%E5%8F%B7%E4%B8%80%E8%A6%A7/%E5%85%B1%E9%97%98%E7%B3%BB",
    level = "https://gbf-wiki.com/index.php?%E7%A7%B0%E5%8F%B7%E4%B8%80%E8%A6%A7/%E8%82%B2%E6%88%90%E7%B3%BB",
    sandbox = "https://gbf-wiki.com/index.php?%E7%A7%B0%E5%8F%B7%E4%B8%80%E8%A6%A7/%E3%82%A2%E3%83%BC%E3%82%AB%E3%83%AB%E3%83%A0%E7%B3%BB",
    other = "https://gbf-wiki.com/index.php?%E7%A7%B0%E5%8F%B7%E4%B8%80%E8%A6%A7/%EF%BC%9F%EF%BC%9F%EF%BC%9F"
  )

all_tbl <-
  purrr::map(pages, \(url) {
    page <- rvest::read_html(url)
    tbls <-
      rvest::html_elements(page, ".ie5 > .style_table") |>
      rvest::html_table()
    purrr::list_rbind(tbls[-1])
  }) |>
  purrr::list_rbind()

# colnames(all_tbl)
all_tbl <- dplyr::select(all_tbl, `称号名`, `獲得条件`, `イベント名`)

readr::write_csv(all_tbl, "scripts/gbf-title.csv")
