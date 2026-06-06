Feature: Authentication

  Scenario: Unauthenticated user sees the login page
    Given I open the login page
    Then I should see the login heading
    And I should see the Google sign-in button

  Scenario: Unauthenticated user is redirected when accessing a protected route
    Given I try to access the contracts page
    Then I should be redirected to the login page

  Scenario: Unauthenticated user is redirected when accessing the new contract page
    Given I try to access the new contract page
    Then I should be redirected to the login page
