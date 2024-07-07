import { describe, it } from 'vitest';
import express from '../src/express.js';

describe('app.listen()', () => {
  it('should wrap with an HTTP server', () => new Promise(done =>{
    var app = express();

    var server = app.listen(0, () => {
      server.close(done)
    });
  }));
})
