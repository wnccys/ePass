import { defineConfig } from '@wagmi/cli'
import { foundry, react } from '@wagmi/cli/plugins'

export default defineConfig({
  out: 'src/generated.ts',
  contracts: [],
  plugins: [
    foundry({
      // Points to your foundry root directory relative to this frontend root
      project: '../smart-contracts',

      // Optional: If your foundry.toml uses a custom output folder instead of 'out'
      artifacts: 'out/',
    }),
    react()
  ],
})
