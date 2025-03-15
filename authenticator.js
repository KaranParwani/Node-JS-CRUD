const secret_key = "9038520395u82903850923";

function authenticate(request, response, next) {
    const auth_header = request.headers["authorization"];
    const token = auth_header && auth_header.split(" ")[1];

    if (!token) {
        return response.status(401).json({message: "No token was provided"});
    }

    jwt.verify(token, secret_key, (error, user) => {
        if (error) {
            return response.status(403).json({message: "Invalid Token"});
        }

        request.user = user;
        next();
    })
}