# ==========================================
# Estágio 1: Dependências
# ==========================================
FROM node:24-alpine AS deps
# libc6-compat é necessário para o Next.js e o motor de imagens (Sharp) no Alpine
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copia os arquivos de lock para instalar dependências exatas
COPY package.json package-lock.json ./
RUN npm install

# ==========================================
# Estágio 2: Builder
# ==========================================
FROM node:24-alpine AS builder
WORKDIR /app

# Copia as dependências instaladas no estágio anterior
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Desabilita a telemetria do Next.js
ENV NEXT_TELEMETRY_DISABLED=1

# Executa o build da aplicação (vai gerar a pasta .next/standalone)
RUN npm run build

# ==========================================
# Estágio 3: Runner (Ultra Leve)
# ==========================================
FROM node:24-alpine AS runner
WORKDIR /app

# Define ambiente de produção
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Cria um usuário não-root por motivos de segurança
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copia apenas o estritamente necessário para o servidor rodar
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Define o usuário criado
USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Executa o servidor otimizado gerado pelo modo standalone
CMD ["node", "server.js"]