import { app } from './app.js';
import { config } from './lib/config.js';

app.listen(config.port, () => {
  console.log(`[backend] http://localhost:${config.port} 에서 실행 중`);
});
