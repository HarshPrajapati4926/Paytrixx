import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";
import { toast } from "react-toastify";

const getStoredAuth = () => {
  const token =
    sessionStorage.getItem("adminToken") || localStorage.getItem("adminToken");
  const user =
    sessionStorage.getItem("adminInfo") || localStorage.getItem("adminInfo");

  let parsed = null;
  try {
    parsed = user ? JSON.parse(user) : null;
  } catch {
    parsed = null;
  }
  return { token: token || null, user: parsed };
};

// POST /api/admin/login  ->  { success, token, admin: { id, name, email, role } }
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async ({ email, password, remember }, thunkAPI) => {
    try {
      const { data } = await api.post("/api/admin/login", { email, password });

      if (data.success && data.token && data.admin) {
        const store = remember ? localStorage : sessionStorage;
        store.setItem("adminToken", data.token);
        store.setItem("adminInfo", JSON.stringify(data.admin));
        toast.success("Login successful");
        return { token: data.token, user: data.admin };
      }

      const message = data.message || "Invalid credentials";
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    } catch (err) {
      const message = err.response?.data?.message || "Login failed";
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

const stored = getStoredAuth();

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: stored.user,
    token: stored.token,
    loading: false,
    error: null,
  },
  reducers: {
    logout: (state) => {
      sessionStorage.clear();
      localStorage.clear();
      state.user = null;
      state.token = null;
      state.error = null;
      toast.info("Logged out");
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
