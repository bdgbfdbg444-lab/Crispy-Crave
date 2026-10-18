import React from "react";
import { logIncident } from "../monitoring/IncidentLogger";

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        // Handle chunk loading failure after new deployment
        const msg = (error?.message || '').toLowerCase();
        const isChunkError = msg.includes('dynamically imported module') || 
                             msg.includes('loading chunk') || 
                             msg.includes('importing a module script failed');

        if (isChunkError) {
            const lastReload = parseInt(sessionStorage.getItem('chunk_reload_attempted') || '0', 10);
            if (Date.now() - lastReload > 15000) {
                sessionStorage.setItem('chunk_reload_attempted', Date.now().toString());
                window.location.reload();
                return { hasError: false };
            }
        }

        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        const msg = (error?.message || '').toLowerCase();
        const isChunkError = msg.includes('dynamically imported module') || 
                             msg.includes('loading chunk') || 
                             msg.includes('importing a module script failed');

        if (!isChunkError) {
            logIncident('REACT', 'CRITICAL', error, { 
                reactErrorInfo: errorInfo, 
                source: 'WEBSITE' 
            });
        }
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    minHeight: "100vh",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#0D0D0D",
                    color: "#F5F5F7",
                    padding: "24px",
                    textAlign: "center",
                    fontFamily: "system-ui, -apple-system, sans-serif"
                }}>
                    <div style={{
                        maxWidth: "420px",
                        backgroundColor: "#161616",
                        border: "1px solid rgba(225, 29, 72, 0.3)",
                        borderRadius: "24px",
                        padding: "32px 24px",
                        boxShadow: "0 20px 40px rgba(0,0,0,0.8)"
                    }}>
                        <div style={{
                            width: "60px",
                            height: "60px",
                            borderRadius: "50%",
                            backgroundColor: "rgba(225, 29, 72, 0.15)",
                            color: "#e11d48",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "28px",
                            margin: "0 auto 16px"
                        }}>
                            ⚠️
                        </div>
                        <h2 style={{ fontSize: "20px", fontWeight: "800", marginBottom: "8px", color: "#FFFFFF" }}>
                            عذراً، حدث تحديث في الصفحة
                        </h2>
                        <p style={{ fontSize: "14px", color: "#8E8E93", marginBottom: "24px", lineHeight: "1.6" }}>
                            تم تحديث بعض ملفات الموقع، يرجى تحديث الصفحة لمتابعة طلبك.
                        </p>
                        <button 
                            onClick={() => window.location.reload()} 
                            style={{
                                width: "100%",
                                padding: "14px",
                                backgroundColor: "#e11d48",
                                color: "#FFFFFF",
                                border: "none",
                                borderRadius: "12px",
                                fontWeight: "700",
                                fontSize: "15px",
                                cursor: "pointer",
                                boxShadow: "0 4px 14px rgba(225, 29, 72, 0.4)"
                            }}
                        >
                            تحديث ومتابعة الطلب
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;
