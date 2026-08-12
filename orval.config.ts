import { defineConfig } from 'orval';

export default defineConfig({
  auth: {
    input: './openapi.json',
    output: {
      target: './src/api/index.ts',
      client: 'react-query',
      mode: 'tags-split',
      clean: true,
      override: {
        mutator: {
          path: './src/lib/axios.ts',
          name: 'customInstance',
        },
      },
    },
  },
});
