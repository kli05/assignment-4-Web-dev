const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
const STORAGE_KEY = "hm_library_session";
async function callApi(path, method, body) {
  const options = {
    method: method,
    headers: {},
  };
  if (body !== undefined) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }
  let response = null;
  try {
    response = await fetch(BASE_URL + path, options);
  } catch (error) {
    throw new Error("Cannot reach the server. Please check that the backend is running.");
  }
  let data = null;
  try {
    data = await response.json();
  } catch (error) {
    data = null;
  }
  if (response.ok === false) {
    if (data && data.message) {
      throw new Error(data.message);
    }
    throw new Error("The server returned an error (" + response.status + ").");
  }

  return data;
}

export function signIn(membershipId, password) {
  return callApi("/login", "POST", {
    membershipId: membershipId,
    password: password,
  });
}

export function rememberSession(userId) {
  localStorage.setItem(STORAGE_KEY, userId);
}

export async function restoreSession() {
  const storedId = localStorage.getItem(STORAGE_KEY);
  if (storedId === null) {
    return null;
  }
  try {
    return await callApi("/users/" + storedId, "GET");
  } catch (error) {
    return null;
  }
}

export function forgetSession() {
  localStorage.removeItem(STORAGE_KEY);
}

export function fetchAccounts() {
  return callApi("/users", "GET");
}

export function createAccount(userData) {
  return callApi("/users", "POST", userData);
}

export function editAccount(id, userData) {
  return callApi("/users/" + id, "PUT", userData);
}

export function removeAccount(id) {
  return callApi("/users/" + id, "DELETE");
}

export function fetchBooks() {
  return callApi("/books", "GET");
}

export function createBook(bookData, recordedById) {
  const body = {
    ...bookData,
    recordedById: recordedById,
  };
  return callApi("/books", "POST", body);
}

export function editBook(id, bookData) {
  return callApi("/books/" + id, "PUT", bookData);
}

export function removeBook(id) {
  return callApi("/books/" + id, "DELETE");
}

export function fetchLedger() {
  return callApi("/transactions", "GET");
}

export function postStockChange(bookId, type, quantity, recordedById) {
  return callApi("/transactions", "POST", {
    type: type,
    bookId: bookId,
    quantity: quantity,
    recordedById: recordedById,
  });
}

export function checkoutBook(bookId, memberId, quantity, recordedById) {
  return callApi("/transactions", "POST", {
    type: "borrow",
    bookId: bookId,
    memberId: memberId,
    quantity: quantity,
    recordedById: recordedById,
  });
}

export function checkinBook(recordId, recordedById) {
  return callApi("/transactions", "POST", {
    type: "return",
    recordId: recordId,
    recordedById: recordedById,
  });
}

export function fetchLoans(userId) {
  if (userId) {
    return callApi("/borrow-records?userId=" + userId, "GET");
  }

  return callApi("/borrow-records", "GET");
}
