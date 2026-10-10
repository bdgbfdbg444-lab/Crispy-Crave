import React from 'react';
import { logIncident } from './IncidentLogger';

export class CentralErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error("CentralErrorBoundary caught an error:", error, errorInfo);
        logIncident('REACT', 'ERROR', error, errorInfo.componentStack);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                    <h2>Something went wrong.</h2>
                    <p>Our team has been notified. Please refresh the page.</p>
                </div>
            );
        }
        return this.props.children;
    }
}
