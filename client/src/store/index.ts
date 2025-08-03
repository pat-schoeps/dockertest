import { configureStore } from '@reduxjs/toolkit'
import { apiSlice } from '../services/api'

export const store = configureStore({
  reducer: {
    api: apiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch