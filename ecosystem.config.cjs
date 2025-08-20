module.exports = {
  apps: [
    {
      name: "ambrosia-frontend",
      script: "npm",
      args: "run dev:frontend",   // your package.json script (should set port 3000)
      cwd: "/home/cpw/ambrosia",
      env: {
        NODE_ENV: "development"
      }
    },
    {
      name: "ambrosia-backend",
      script: "npm",
      args: "run dev:backend",
      cwd: "/home/cpw/ambrosia",
      env: {
        NODE_ENV: "development"
      }
    }
  ]
};



