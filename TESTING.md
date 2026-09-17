# Testing Log

| Test ID | Feature             | Action                                                     | Expected Result                                                   | Result | Notes                                                                                    |
| ------- | ------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------- |
| T001    | Initial homepage    | Open `index.html` using Live Server or in a web browser    | The page displays “Ledger Quest” and “Learn accounting by doing.” | Pass   | Initial HTML, Bootstrap link, CSS link and JavaScript links are in place.                |
| T002    | Responsive viewport | Open browser developer tools and reduce the viewport width | Content remains visible with no horizontal scrolling              | Pass   | Basic viewport meta tag added; fuller responsive tests will follow once layout is built. |
| T003    | Browser console     | Open Developer Tools → Console and refresh the page        | No red error messages appear                                      | Pass   | No JavaScript functionality has been added yet.                                          |
