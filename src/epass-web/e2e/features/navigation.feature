Feature: Basic Navigation and Smoke Test

  Scenario: User visits the public landing page and proceeds to login page
    Given I open the landing page
    Then I should see the main heading containing "Contracts"
    And I should see a link to the login page
    When I click the login page link
    Then I should be redirected to the login page
    And I should see the header "Get started with Us"
