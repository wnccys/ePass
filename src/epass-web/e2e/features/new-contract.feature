Feature: New Contract Form

  Background:
    Given I am on the new contract page as a club

  Scenario: Form renders all required fields
    Then I should see the contract title field
    And I should see the player wallet address field
    And I should see the attorney wallet address field
    And I should see the document upload area
    And I should see the caution amount field

  Scenario: Form shows validation error for invalid wallet address
    When I fill the player wallet address with "not-a-wallet"
    And I blur the player wallet field
    Then I should see a wallet validation error

  Scenario: Form shows validation error for short contract title
    When I fill the contract title with "Hi"
    And I blur the title field
    Then I should see a title validation error

  Scenario: Submit button is present and labeled correctly
    Then I should see the submit button labeled "Create Draft Agreement"

  Scenario: Document upload area accepts PDF files
    Then I should see the IPFS upload zone
    And the upload zone should mention "PDF"
