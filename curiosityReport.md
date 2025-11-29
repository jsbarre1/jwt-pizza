# Curiosity Report: Deep Dive into JSON Web Tokens (JWT)

## Introduction

While working with JWT Pizza, I realized that JWTs are fundamental to modern web authentication, yet I only understood them superficially. This report explores the history, technical implementation, security vulnerabilities, and architectural trade-offs of JWT technology.

## History and Creation of JWT

JSON Web Token (JWT) was officially standardized in May 2015, culminating a 4.5-year effort beginning around late 2010. The specification was authored by Michael B. Jones, John Bradley, and Nat Sakimura, working within the OAuth working group with dozens of active participants.

Before JWT, authentication mechanisms were often proprietary and ill-suited for distributed systems. JWT was designed to provide:
- A compact, URL-safe means of representing claims between parties
- A standardized format working across platforms and languages
- Support for both signed (JWS) and encrypted (JWE) tokens
- Stateless authentication suitable for distributed architectures

## Technical Implementation: How JWT Works

### The Three-Part Structure

A JWT consists of three Base64URL-encoded parts separated by dots: `header.payload.signature`

**1. Header (JOSE Header)** - Contains metadata:
```json
{
  "alg": "HS256",
  "typ": "JWT",
  "kid": "key-id-optional"
}
```

**2. Payload** - Contains claims about the user:
```json
{
  "sub": "1234567890",
  "name": "John Doe",
  "iat": 1516239022,
  "exp": 1516242622,
  "aud": "jwt-pizza"
}
```

**3. Signature** - Ensures integrity:
```
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  secret
)
```

### Authentication Flow

1. User sends credentials to server
2. Server validates and generates JWT with secret key
3. Server returns JWT to client
4. Client includes JWT in Authorization header: `Authorization: Bearer <token>`
5. Server verifies signature and claims before granting access
6. If valid, server processes request with user context

### Verification Process

The server decodes the header and payload, re-signs them with the same algorithm and secret, then compares signatures. If they match and claims (expiration, audience) are valid, the token is authentic.

## JWT vs. Session-Based Authentication

### When JWT Excels

**Best for**: SPAs, mobile apps, microservices, cross-domain auth, distributed systems

**Advantages**:
- **Performance**: No database lookup per request
- **Scalability**: Stateless nature enables horizontal scaling
- **Cross-Domain**: Works across multiple domains and services
- **Mobile-Friendly**: Doesn't rely on cookies

### When Sessions Are Better

**Best for**: Traditional web apps, banking/healthcare, systems requiring immediate revocation

**Advantages**:
- **Security**: Session data hidden from users
- **Revocation**: Easy to invalidate immediately
- **Simpler**: Less complex to implement securely
- **Privacy**: Sensitive data stays server-side

### Performance Comparison

| Aspect | JWT | Session |
|--------|-----|---------|
| Subsequent Requests | Fast (no DB lookup) | Slower (DB required) |
| Bandwidth | Higher (full token) | Lower (session ID) |
| Server Memory | Minimal | Grows with users |
| Scalability | Excellent | Challenging |
| Revocation | Difficult | Easy |

## Best Practices for Secure Implementation

### Algorithm Security
- **Never** allow the `"none"` algorithm
- Explicitly whitelist allowed algorithms
- Use asymmetric algorithms (RS256) for multi-service environments
- Verify algorithm before validating signature

### Secret Management
- Use cryptographically random secrets (minimum 256 bits for HS256)
- Rotate secrets regularly
- Store in environment variables or secret management services
- Never commit to version control

### Claim Validation
- **Always** validate `exp` (expiration)
- Validate `aud` (audience) to prevent cross-service attacks
- Validate `iss` (issuer) for trusted sources
- Use short expiration times (minutes to hours)

### Input Validation
- Validate `kid` parameter against whitelist
- Sanitize all header parameters
- Never use user-controlled values in file paths or queries

### Token Storage
- Store in httpOnly cookies to prevent XSS
- Use secure flag in production
- Consider SameSite attribute for CSRF protection

### Revocation Strategy
- Implement short expiration times
- Maintain token blocklist for critical revocations
- Use refresh token rotation
- Consider hybrid approach with session validation

## Practical Experimentation with JWT Pizza

I examined the JWT Pizza codebase authentication implementation and found:

**Strengths**:
- Short expiration times for security
- Secrets properly externalized to environment variables
- Validates signatures and expiration times
- Uses industry-standard HMAC SHA256

**Potential Improvements**:
- Add `aud` claim validation for multi-service protection
- Implement refresh token rotation
- Add comprehensive authentication event logging
- Consider even shorter expiration with automatic refresh

## Conclusion

This deep dive revealed that while JWTs are powerful, they demand significant security vigilance. The technology is sound when implemented correctly, but specification flexibility has led to numerous vulnerabilities in practice.

### Key Takeaways

1. **Security is Implementation-Dependent**: JWT security relies on proper implementation, not just the standard
2. **Trade-offs Matter**: JWTs offer performance and scalability but sacrifice some security controls
3. **Context is Critical**: Choose authentication mechanisms based on specific use case requirements
4. **Vigilance Required**: Regular security audits and updates are essential

### Personal Growth

This research transformed my understanding from "just use JWTs" to nuanced appreciation of:
- When JWTs are appropriate versus when sessions are better
- Critical security pitfalls and how to avoid them
- Proper token validation and security practices
- Historical context shaping modern authentication

Understanding these concepts deeply makes me a more security-conscious developer and better equipped for architectural decisions in future projects.