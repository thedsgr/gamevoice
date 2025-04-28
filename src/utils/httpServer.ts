import express from 'express';
import { moveToTeamVoiceChannel } from '../services/matchManager';
import crypto from 'crypto';
import https from 'https';
import fs from 'fs';
import { Request, Response } from 'express';

const app = express();
app.use(express.json());

// Função para validar a assinatura do webhook
function validateRiotWebhook(req: Request, secret: string): boolean {
  const signature = req.headers['x-riot-signature'] as string;
  const payload = JSON.stringify(req.body);
  const hmac = crypto.createHmac('sha256', secret).update(payload).digest('hex');

  return signature === hmac;
}

// Extraímos a lógica do webhook para uma função separada
async function riotWebhookHandler(req: Request, res: Response): Promise<void> {
  const secret = process.env.RIOT_WEBHOOK_SECRET || '';

  if (!validateRiotWebhook(req, secret)) {
    res.status(401).send('Assinatura inválida');
    return;
  }

  const { eventType, playerId, gameId } = req.body;

  try {
    if (eventType === 'MATCH_END') {
      console.log(`Evento MATCH_END recebido para o jogo ${gameId}`);
      // Adicione aqui a lógica para mover os jogadores
    } else {
      await moveToTeamVoiceChannel(playerId, gameId);
    }

    res.status(200).send('Notificação processada com sucesso');
  } catch (error) {
    console.error('Erro ao processar notificação:', error);
    res.status(500).send('Erro interno');
  }
}

// Configuração do endpoint usando a função separada
app.post('/webhook/riot', riotWebhookHandler);

// Configurar HTTPS
const httpsOptions = {
  key: fs.readFileSync('./certs/private-key.pem'),
  cert: fs.readFileSync('./certs/certificate.pem'),
};

// Atualizar a função para iniciar o servidor HTTPS e retornar a instância do servidor
export function startHttpServer() {
  const server = https.createServer(httpsOptions, app);
  server.listen(3000, () => {
    console.log('Servidor de Webhooks rodando com HTTPS na porta 3000');
  });
  return server;
}

// Adicionar tratamento de erros global
app.use((err: Error, req: Request, res: Response, next: express.NextFunction) => {
  console.error('Erro não tratado:', err);
  res.status(500).send('Erro interno do servidor');
});