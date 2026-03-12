const rawBaseUrl =
	
	process.env.NEXT_PUBLIC_BACKEND_BASE_URL ||
	"";

const normalizedBaseUrl = rawBaseUrl.replace(/\/$/, "");

export const API_BASE_URL = normalizedBaseUrl
	? `${normalizedBaseUrl}/api`
	: "";