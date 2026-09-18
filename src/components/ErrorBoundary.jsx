import React from "react";
import { WebsiteMonitor } from "../services/websiteMonitor";

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        WebsiteMonitor.logIncident({
            type: "WEBSITE_ERROR",
            severity: "CRITICAL",
            message: error.message,
            stackTrace: error.stack || "",
            source: "WEBSITE",
            operation: "REACT_RENDER_ERROR"
        });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: "20px", color: "white", backgroundColor: "#1e1e1e", textAlign: "center" }}>
                    <h2>عذراً، حدث خطأ غير متوقع في الموقع.</h2>
                    <p>تم تسجيل الخطأ وجاري العمل على إصلاحه.</p>
                    <button onClick={() => window.location.reload()} style={{ padding: "10px", marginTop: "10px" }}>تحديث الصفحة</button>
                </div>
            );
        }
        return this.props.children;
    }
}
export default ErrorBoundary;

