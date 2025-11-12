// Thin compatibility layer: older tests import from utils/api —
// re-export the relevant functions from enhancedApi which now
// contains the shared API helpers used across the app.
export { handleApiError, getBaseUrl, loginApi } from './enhancedApi';

// Keep a default export for potential legacy imports
import * as _impl from './enhancedApi';
export default _impl;
