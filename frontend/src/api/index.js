import axios from "axios";
import client from "./client";

const publicClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3000",
  headers: { "Content-Type": "application/json" },
});

export const publicApi = {
  getTournamentBySlug: (slug) => publicClient.get(`/public/tournaments/${slug}`),
};

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

export const profileApi = {
  updateProfile: (data) => client.patch("/auth/profile", data),
  updatePassword: (data) => client.patch("/auth/password", data),
  updateBranding: (data) => client.patch("/auth/branding", data),
};

export const authApi = {
  forgotPassword: (email) => publicClient.post("/auth/forgot-password", { email }),
  resetPassword: (token, password) => publicClient.post(`/auth/reset-password/${token}`, { password }),
};
