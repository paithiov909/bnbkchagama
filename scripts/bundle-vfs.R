if (requireNamespace("rwasm", quietly = TRUE)) {
  rwasm::add_pkg(
    c("codetools", "RcppAnnoy"),
    repo_dir = "repo",
    dependencies = NA,
    compress = FALSE
  )
  rwasm::make_vfs_library(
    out_dir = "public",
    out_name = "library.data",
    repo_dir = "repo",
    compress = TRUE
  )
  in_dir <- fs::path_abs("./scripts/data") # `in_dir` must be an absolute path.
  rwasm::file_packager(in_dir, out_dir = "public", out_name = "csv", compress = FALSE)
}
