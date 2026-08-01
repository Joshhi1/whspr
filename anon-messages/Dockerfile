# ============================================================================
# Stage 1 — build the React frontend
# ============================================================================
FROM node:22-alpine AS frontend-build
WORKDIR /app/frontend

# Public Supabase config needed at build time (Vite inlines these into the bundle).
# Set these as Build Arguments in Render's dashboard for this service.
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# ============================================================================
# Stage 2 — backend + serve the built frontend
# ============================================================================
FROM node:22-alpine AS runtime
WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm install --omit=dev
COPY backend/ ./

# Bring in the built frontend so Express can serve it as static files
COPY --from=frontend-build /app/frontend/dist /app/frontend/dist

ENV NODE_ENV=production
EXPOSE 4000
CMD ["node", "server.js"]
