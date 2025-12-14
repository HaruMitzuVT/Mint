class AppCertificateGenerator {
    constructor(appName, appVersion) {
        this.appName = appName;
        this.appVersion = appVersion;
    }

    generateCertificate() {
        const certificate = {
            name: this.appName,
            version: this.appVersion,
            issuedAt: new Date().toISOString(),
            validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // valid for 1 year
            issuer: "AppCertificateGenerator"
        };
        return certificate;
    }
}

export { AppCertificateGenerator };