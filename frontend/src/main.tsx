import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import {Provider} from "@/components/ui/provider"
import {AppRouter} from "@/router/AppRouter.tsx";

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <Provider>
            <AppRouter />
        </Provider>
    </StrictMode>,
)
