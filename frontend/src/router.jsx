import { createBrowserRouter } from 'react-router-dom'
import { ErrorPage } from "./components/ErrorPage";
import { Dataset } from "./components/Dataset";
import { App } from "./App"
import { Exporter } from "./components/Exporter";
import { dataLoader } from './components/Dataset/Dataset';

export const router = createBrowserRouter([
    {
        errorElement: <ErrorPage />,
        children: [
            {
                path: "/",
                exact: true,
                element: <App />,
                children: [
                    {
                        path: "dataset/page/:pageId",
                        loader: dataLoader,
                        element: <Dataset />
                    },
                    {
                        path: "export",
                        element: <Exporter />
                    }
                ]
            }
        ]
    }
]);