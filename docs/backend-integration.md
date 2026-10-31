# Patient backend integration

The API base URL defaults to `https://unstarched-maritally-ike.ngrok-free.dev`.
Copy `.env.example` to `.env` to override `EXPO_PUBLIC_API_URL` (base URL, without `/graphql`). Restart Expo after changing it.

- Login/sign-up: request an OTP, then enter `000000` in this demo environment. New patients complete their profile before entering the tabs.
- Native refresh tokens use Expo SecureStore. Access tokens stay in memory. Web authentication is memory-only and ends on page reload.
- Expired access tokens refresh once, including concurrent failed requests. Network failures do not automatically repeat wallet mutations.
- Patient records supply wallet transactions, vitals, consultation history, and prescriptions. Amounts are displayed as ZMW.
- QR screens share the same server-issued token. Opening the first card requests it; Refresh explicitly rotates it. The countdown never polls or regenerates tokens. Expired codes cannot be shared.
- The app checks deployed subscription capabilities. If all five patient subscriptions are supported it connects using `graphql-ws`; otherwise use the Refresh controls. The deployed schema did not expose subscriptions during integration.
- AI chat/analysis remains local, as requested. Voice notes support local recording/playback.
- Lab-test records, savings, language/contact/password updates, appointment booking, and patient-to-provider QR check-in are not operations in this schema. These views clearly distinguish preview/local features from server-backed records. Staff scan the patient card to begin consultations or retrieve prescriptions.

## Verification

`npm run test:api` covers bearer requests, concurrent refresh, logout during refresh, avoiding repeated financial mutations on network failure, payment errors, anonymous requests, and patient-operation schema validation. `docs/backend-schema.graphql` is the supplied contract from the backend repository.

The live endpoint and HTTP operation shapes were checked using read-only introspection. No live patient account was created and no payment mutation was executed during verification. Device microphone permissions, keyboard behaviour, and authenticated end-to-end flows need a device smoke test.

New native audio and secure-storage modules require rebuilding an existing custom development client. Do not edit generated native folders manually.
