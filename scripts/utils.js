export class Ui {
  static alert(
    icon = "success",
    title,
    message,
    showConfirmButton,
    showCancelButton,
  ) {
    const isAction = icon === "question" || icon === "warning";
    const confirm =
      typeof showConfirmButton === "boolean" ? showConfirmButton : isAction;
    const cancel =
      typeof showCancelButton === "boolean" ? showCancelButton : isAction;

    try {
      const result = CoolAlert.show({
        icon,
        title,
        text: message,
        showConfirmButton: confirm,
        showCancelButton: cancel,
      });

      if (result && typeof result.then === "function") {
        return result;
      }
      return Promise.resolve({ isConfirmed: true });
    } catch (e) {
      return Promise.resolve({ isConfirmed: true });
    }
  }

  static toast(icon = "success", title, message) {
    CoolAlert.show({
      toast: true,
      icon,
      title,
      text: message,
    });
  }
}

export class Api {
  // static baseUrl = "http://localhost:3000/api/v1";
   // static baseUrl = "https://zipsurf.veetech.site/api/v1"; 
   static baseUrl = "https://zipsurf-server.onrender.com/api/v1"; 
  

  static getHeaders() {
    const headers = {
      "Content-Type": "application/json",
    };
    const token = localStorage.getItem("token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  }

  static async request(endpoint, method = "GET", body = null) {
    const options = {
      method,
      headers: this.getHeaders(),
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, options);
      const data = await response.json();

      if (!response.ok) {
        // Handle Token Expiry (Redirect to login only for non-auth/non-public-verify routes)
        const isAuthRoute =
          endpoint === "/auth/login" || endpoint === "/auth/register";
        const isPublicVerify = endpoint === "/officers/verify";

        if (response.status === 401 && !isAuthRoute && !isPublicVerify) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.location.href = "../login/index.html";
        }
        throw new Error(data.message || "API Request Failed");
      }

      return data;
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }

  static get(endpoint) {
    return this.request(endpoint, "GET");
  }

  static post(endpoint, body) {
    return this.request(endpoint, "POST", body);
  }

  static patch(endpoint, body) {
    return this.request(endpoint, "PATCH", body);
  }

  static delete(endpoint) {
    return this.request(endpoint, "DELETE");
  }

  static logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "../login/index.html";
  }
}
