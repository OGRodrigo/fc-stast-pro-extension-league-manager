import client from "./client";

export const clubsApi = {
  getAll: () => client.get("/clubs"),
  getOne: (id) => client.get(`/clubs/${id}`),
  create: (data) => client.post("/clubs", data),
  update: (id, data) => client.patch(`/clubs/${id}`, data),
  remove: (id) => client.delete(`/clubs/${id}`),
};

export const tournamentsApi = {
  getAll: () => client.get("/tournaments"),
  getOne: (id) => client.get(`/tournaments/${id}`),
  create: (data) => client.post("/tournaments", data),
  update: (id, data) => client.patch(`/tournaments/${id}`, data),
  remove: (id) => client.delete(`/tournaments/${id}`),
  addClub: (tId, cId) => client.post(`/tournaments/${tId}/clubs/${cId}`),
  removeClub: (tId, cId) => client.delete(`/tournaments/${tId}/clubs/${cId}`),
  getClubs: (tId) => client.get(`/tournaments/${tId}/clubs`),
  getTable: (tId) => client.get(`/tournaments/${tId}/table`),
};

export const matchesApi = {
  getAll: (tId) => client.get(`/tournaments/${tId}/matches`),
  getOne: (id) => client.get(`/matches/${id}`),
  create: (tId, data) => client.post(`/tournaments/${tId}/matches`, data),
  update: (id, data) => client.patch(`/matches/${id}`, data),
  remove: (id) => client.delete(`/matches/${id}`),
};

export const aiApi = {
  parseMatchImages: (tournamentId, files) => {
    const formData = new FormData();
    formData.append("tournamentId", tournamentId);
    files.forEach((file) => formData.append("images", file));
    return client.post("/ai/parse-match-images", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};
