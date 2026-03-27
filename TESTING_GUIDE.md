# Testing Guide for New Components

## Test File Structure

All test files follow this pattern:
- Location: `frontend/src/components/[ComponentName]/[ComponentName].test.tsx`
- Framework: React Testing Library + Jest
- Mocking: Mock child components from `@/components`

## Test Coverage Checklist

For each component, test:

### 1. Rendering
- ✅ Component renders without errors
- ✅ All required props are displayed
- ✅ Conditional rendering works correctly

### 2. User Interactions
- ✅ Button clicks trigger correct callbacks
- ✅ Form inputs update state correctly
- ✅ Checkboxes/selects work as expected

### 3. Edge Cases
- ✅ Handles missing/optional props
- ✅ Handles empty arrays/lists
- ✅ Handles loading states
- ✅ Handles error states

### 4. Memoization (for memoized components)
- ✅ Component doesn't re-render when props haven't changed
- ✅ Component re-renders when relevant props change

## Running Tests

```bash
cd frontend
npm test
```

## Example Test Files Created

1. `AllocationCard.test.tsx` - Complete example with all test cases
2. `ApplicantSummary.test.tsx` - Basic rendering tests

## Remaining Test Files to Create

1. `AllocationsList.test.tsx` - Test virtualization and rendering
2. `ApplicantAllocations.test.tsx` - Test staff reviews display
3. `ApplicantDocuments.test.tsx` - Test document upload/delete
4. `ManualAllocation.test.tsx` - Test manual allocation form
5. `ManualEntryModal.test.tsx` - Test modal form submission
6. `ApplicantMatches.test.tsx` - Test matches display
7. `ApplicantUploadModal.test.tsx` - Test file upload

## Notes

- Use `@testing-library/react` for component testing
- Use `@testing-library/user-event` for user interactions
- Mock external dependencies (API calls, services)
- Test accessibility where applicable

