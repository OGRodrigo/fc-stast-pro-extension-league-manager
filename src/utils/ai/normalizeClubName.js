function normalizeClubName(name = "") {
  return String(name)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

module.exports = normalizeClubName;
