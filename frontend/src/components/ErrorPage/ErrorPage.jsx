import React from 'react'
import "./style.css"
import { useRouteError } from 'react-router-dom';

export function ErrorPage({ errorText }) {
    const error = useRouteError()
    return (
        <div id="error-page">
            <h1>Oops!</h1>
            <p>Sorry, an unexpected error has occurred.</p>
            <p>
                <i>{errorText || error.statusText || error.message}</i>
            </p>
        </div>
    );
}