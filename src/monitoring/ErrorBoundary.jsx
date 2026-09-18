import React, { Component } from "react";
import { logIncident } from "./IncidentLogger";

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        logIncident("REACT_ERROR", "ERROR", error);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: "20px", textAlign: "center", marginTop: "50px" }}>
                    <h2>عذراً، حدث خطأ غير متوقع.</h2>
                    <p>برجاء تحديث الصفحة أو المحاولة لاحقاً.</p>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
