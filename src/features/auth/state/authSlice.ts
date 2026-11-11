import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { AuthUser } from '../../../types/auth.types';
import {
  authenticate,
  saveUser,
} from '../services/authService';

interface AuthState {
  user: AuthUser | null;
  status: 'idle' | 'loading';
}

const initialState: AuthState = {
  user: null,
  status: 'idle',
};

export const loginUser = createAsyncThunk<
  AuthUser,
  { email: string; password: string },
  { rejectValue: string }
>('auth/login', async ({ email, password }, { rejectWithValue }) => {
  try {
    const user = await authenticate(email, password);
    saveUser(user);
    return user;
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : 'Unable to sign in.',
    );
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loggedOut(state) {
      state.user = null;
      state.status = 'idle';
    },
  },
  extraReducers(builder) {
    builder
      .addCase(loginUser.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.status = 'idle';
      })
      .addCase(loginUser.rejected, (state) => {
        state.status = 'idle';
      });
  },
});

export const { loggedOut } = authSlice.actions;
export const authReducer = authSlice.reducer;
