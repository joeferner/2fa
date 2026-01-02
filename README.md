# 2FA

Self hosted encrypted Two-Factor Authentication (2FA)

# Usage

1. Run `npm run dev`
1. Open a web browser to the web site
1. Enter your desired password
1. Open the "Raw Data" section and add JSON that matches the following format

    ```json
    [
      { "name": "Google", "code": "<Google 2fa secret>" },
      { "name": "Amazon", "code": "<Amazon 2fa secret>" }
    ]
    ```

1. Copy the encrypted data into `public/2fa.dat`
1. Run `npm run build`
1. Deploy the `dist` directory to the location of your choice
