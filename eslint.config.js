import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // 이 프로젝트에서 false-positive 인 두 opinionated 규칙을 끈다.
      // - set-state-in-effect: Firestore onSnapshot/비동기 config 로드 등 "외부 시스템과
      //   동기화"하는 정당한 effect 사용(useDraft 파생, 픽 발표 감지, 폼 초기화). E2E 검증됨.
      // - only-export-components: 컨텍스트 파일이 Provider 와 훅을 함께 export 하는 표준 패턴
      //   (Fast Refresh 전용 경고일 뿐 런타임/빌드 무관).
      'react-hooks/set-state-in-effect': 'off',
      'react-refresh/only-export-components': 'off',
    },
  },
])
