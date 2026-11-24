import { z } from 'zod/mini';

/** CSP가 eval을 막으므로 zod가 eval 가능 여부를 시험하다 위반을 남기지 않게 처음부터 끈다. */
z.config({ jitless: true });
