# RULES

ePass' Architectural choices. This can also be used as rules for AI agents.

## General Idea

The architecture focus on simplicity and concepts application.

## Project Structure

The project uses ```pnpm``` as its package manager.

## Database

## Libs

* TailwindCSS
* Shadcn
* i18Next
* Viem
* Wagmi
* Tanstack-Form
* Zod

## CI/CD

### Code Formatting

It uses Biome as linter (run throught Github Actions, no need to run manually).

### Build

epass-web and smart-contracts has its own dedicated CI/CD pipeline in order to check and validate build state.

### Project Image

// TODO

## Linter

## Architecture

### Components

#### General

All components should preferentially use Shadcn components whenever possible. divs and other standard tags are also allowed. But the priority is the shadcn ones.
Globals.css has theme styles and glass styles for components.

#### Forms

* All forms must use @tanstack-form.
* Taking care for validations and outdated function calls. Examples can be seen on the profile/onboarding-form.tsx component.
* All forms validations must be made with Zod.

### Authentication

The project uses Next-Auth with OAuth, specially with Google Provider.

### Wallets

No wallet information is saved on this app's DB. It is saved on cookies and disconnected on sign-out.

### Contracts

Contracts uses Foundry ecosystem and are called on front-end by using wagmi-cli (pnpm wagmi);