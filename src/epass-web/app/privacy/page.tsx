"use client";

import { PublicNavbar } from "@/components/public-navbar";
import { FadeIn } from "@/components/ui/fade-in";
import { Card } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { Shield, Lock, Database, Globe, RefreshCw, ArrowLeft, Scale, Users, FileText, Landmark, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";



export default function PrivacyAndTerms() {
    const { t, i18n } = useTranslation();
    const { status } = useSession();
    const isPt = i18n.language === "pt";

    const content = {
        en: {
            title: "Terms of Service & Privacy Policy",
            subtitle: "Legal framework and data guidelines for the ePass decentralized agreement protocol.",
            lastUpdated: "Last updated: June 2026",
            backButton: "Back to Home",

            // --- TERMS SECTION ---
            termsTitle: "Terms of Service",
            riskWarningTitle: "Cryptographic & Blockchain Risk Disclaimer",
            riskWarningText: "ePass is a decentralized tooling provider. Interacting with the blockchain involves transaction fees (gas), smart contract complexity, and immutable database registry. We do not control or hold custody of your assets, contracts, or private keys. The fractional image rights tokens ($P_IMAGE) emitted by our vaults represent career-backing utility assets and are not speculative financial products or investment securities.",
            termsSections: [
                {
                    icon: <FileText className="h-6 w-6 text-primary" />,
                    title: "1. Service Description and Purpose",
                    paragraphs: [
                        "ePass is a decentralized application (dApp) providing technical tools for players, clubs, and legal attorneys to formalize, register, and fractionalize athlete image rights agreements on the blockchain.",
                        "Our smart contracts issue ERC-721 Master NFTs representing the registered legal contract on IPFS, and clone customized ERC-20 vaults ('RightsVault') allowing clubs to fractionalize these rights into utility tokens ($P_IMAGE)."
                    ]
                },
                {
                    icon: <Users className="h-6 w-6 text-primary" />,
                    title: "2. User Profiles and Onboarding",
                    paragraphs: [
                        "Access to the platform requires connecting a Web3 wallet via Sign-In with Ethereum (SIWE) and completing onboarding.",
                        "Users must select a profile type (Player, Club, or Attorney) during onboarding. This profile selection is permanent and represents the legal capability under which you operate on ePass.",
                        "You warrant that you hold all legal rights, power, and authorization to represent the player, club, or attorney associated with your selected wallet address."
                    ]
                },
                {
                    icon: <Scale className="h-6 w-6 text-primary" />,
                    title: "3. Cryptographic Signature & Minting",
                    paragraphs: [
                        "Agreements are structured off-chain and require EIP-712 signatures from all three parties (Player, Club, and Attorney) before execution.",
                        "Executing RightsMinter.executeMint() permanently mints the Master NFT, assigning ownership to the Club. Once signed and executed, this transaction is irreversible on the blockchain."
                    ]
                },
                {
                    icon: <Landmark className="h-6 w-6 text-primary" />,
                    title: "4. Escrow Vault, Caution & Penalties",
                    paragraphs: [
                        "Fractionalizing a player's image rights ERC-721 requires activating the RightsVault by depositing caution stablecoins (via depositCaution or depositAndMint).",
                        "Early contract rescission before 6 months + 1 day triggers a strict 65% / 35% penalty split governed immutably on-chain by the vault's code, routing the penalty portion automatically based on which party rescinds.",
                        "Upon the full 365-day contract expiration, 100% of the caution escrow amount is returned to the Club. The redemption of ERC-20 fractions is processed proportionally against the active reserve."
                    ]
                },
                {
                    icon: <ShieldAlert className="h-6 w-6 text-primary" />,
                    title: "5. Disclaimers & Regulatory Compliance",
                    paragraphs: [
                        "Sports Law Compliance: Parties are entirely responsible for matching contract registries with sports institutions (e.g., FIFA TMS, FIFA Clearing House, domestic federation bulletins such as CBF BID). ePass does not check sports federation regulations.",
                        "No Liability: We are not responsible for any financial loss, gas cost, wallet compromise, software exploits, or contract disputes between players, clubs, and attorneys."
                    ]
                }
            ],

            // --- PRIVACY SECTION ---
            privacyTitle: "Privacy Policy",
            immutableWarningTitle: "Important Blockchain Notice",
            immutableWarningText: "By registering an agreement on ePass, certain cryptographic proofs (EIP-712 signatures), public wallet addresses, nonces, timestamps, and metadata hashes are permanently written to the public Ethereum blockchain and IPFS. This data is immutable and cannot be deleted, modified, or erased, even upon account deletion. Traditional data erasure rights (e.g., GDPR's 'Right to be Forgotten') do not apply to data written on-chain.",
            privacySections: [
                {
                    icon: <Shield className="h-6 w-6 text-primary" />,
                    title: "1. Information We Collect",
                    paragraphs: [
                        "Web3 Data: Public wallet addresses, smart contract interaction history, transaction hashes, gas consumption records, and cryptographic signatures (EIP-712).",
                        "Account Information: When completing onboarding, we collect your full legal name, profile image (avatar), biography, role selection (Player, Club, or Attorney), and associated email address (retrieved from Google Authentication).",
                        "Device and Metadata: Technical connection logs, browser version, operating system details, and language settings to optimize your dApp interface experience."
                    ]
                },
                {
                    icon: <Lock className="h-6 w-6 text-primary" />,
                    title: "2. Non-Custodial Guarantee",
                    paragraphs: [
                        "ePass is a non-custodial application. We never request, collect, or store your wallet private keys, seed phrases, or security credentials.",
                        "All cryptographic signatures and transaction executions occur client-side through your connected Web3 wallet provider. You are solely responsible for the custody and safety of your digital assets and credentials."
                    ]
                },
                {
                    icon: <Database className="h-6 w-6 text-primary" />,
                    title: "3. How We Use Your Data",
                    paragraphs: [
                        "Authentication and Authorization: Validating your identity via Next-Auth and SIWE to enable protected dashboard actions.",
                        "On-Chain Indexing: Reading public blockchain events to construct your active player/club portfolios, document stats, and transaction feeds.",
                        "Communication and Compliance: Enabling notification systems and ensuring registered agreements conform to structural smart contract rules."
                    ]
                },
                {
                    icon: <Globe className="h-6 w-6 text-primary" />,
                    title: "4. Information Sharing and Visibility",
                    paragraphs: [
                        "On-chain details (minted Master NFTs, fractionalized tokens, caution deposits, and active wallet addresses) are public and searchable by anyone on public block explorers (e.g., Etherscan) and decentralized indexers.",
                        "Off-chain personal details, such as your authentication email, are kept strictly confidential and are never sold, rented, or distributed to third parties for marketing purposes."
                    ]
                },
                {
                    icon: <RefreshCw className="h-6 w-6 text-primary" />,
                    title: "5. Your Rights (GDPR & LGPD Compliance)",
                    paragraphs: [
                        "Under regulations such as GDPR (Europe) and LGPD (Brazil), you have the right to access, rectify, or request the deletion of your personal profile data stored in our traditional database (including your profile name, bio, and avatar).",
                        "You explicitly acknowledge and agree that these rights do not extend to, and cannot be executed upon, immutable records written directly to the blockchain or distributed IPFS files representing the hashed contract metadata."
                    ]
                }
            ]
        },
        pt: {
            title: "Termos de Serviço & Política de Privacidade",
            subtitle: "Estrutura legal e diretrizes de dados para o protocolo descentralizado de acordos ePass.",
            lastUpdated: "Última atualização: Junho de 2026",
            backButton: "Voltar para o Início",

            // --- TERMS SECTION ---
            termsTitle: "Termos de Serviço",
            riskWarningTitle: "Isenção de Responsabilidade sobre Riscos de Blockchain",
            riskWarningText: "O ePass fornece ferramentas descentralizadas. A interação com a blockchain envolve taxas de rede (gas), complexidade de contratos inteligentes e registro imutável em bancos de dados públicos. Não controlamos ou custodiamos seus ativos, contratos ou chaves privadas. Os tokens fracionários de direito de imagem ($P_IMAGE) emitidos pelos cofres representam ativos de utilidade de apoio à carreira e não são produtos financeiros especulativos ou valores mobiliários.",
            termsSections: [
                {
                    icon: <FileText className="h-6 w-6 text-primary" />,
                    title: "1. Descrição e Finalidade do Serviço",
                    paragraphs: [
                        "O ePass é um aplicativo descentralizado (dApp) que fornece ferramentas técnicas para jogadores, clubes e advogados formalizarem, registrarem e fracionarem acordos de direitos de imagem de atletas na blockchain.",
                        "Nossos contratos inteligentes emitem NFTs Mestre ERC-721 que representam o contrato jurídico registrado no IPFS, e clonam cofres ERC-20 customizados ('RightsVault') permitindo aos clubes fracionar esses direitos em tokens de utilidade ($P_IMAGE)."
                    ]
                },
                {
                    icon: <Users className="h-6 w-6 text-primary" />,
                    title: "2. Perfis de Usuário e Onboarding",
                    paragraphs: [
                        "O acesso à plataforma requer a conexão de uma carteira Web3 via Sign-In with Ethereum (SIWE) e a conclusão do onboarding.",
                        "Os usuários devem selecionar um tipo de perfil (Jogador, Clube ou Advogado) durante o onboarding. Essa seleção de perfil é permanente e representa a capacidade jurídica sob a qual você opera no ePass.",
                        "Você garante que possui todos os direitos legais, poderes e autorização para representar o jogador, clube ou advogado associado ao endereço de carteira selecionado."
                    ]
                },
                {
                    icon: <Scale className="h-6 w-6 text-primary" />,
                    title: "3. Assinatura Criptográfica e Cunhagem",
                    paragraphs: [
                        "Os acordos são estruturados off-chain e exigem assinaturas EIP-712 de todas as três partes (Jogador, Clube e Advogado) antes de sua execução.",
                        "A execução da função RightsMinter.executeMint() cunha permanentemente o NFT Mestre, atribuindo a propriedade ao Clube. Uma vez assinada e executada, essa transação é irreversível na blockchain."
                    ]
                },
                {
                    icon: <Landmark className="h-6 w-6 text-primary" />,
                    title: "4. Cofre de Custódia, Caução e Penalidades",
                    paragraphs: [
                        "O fracionamento do NFT ERC-721 de direitos de imagem de um jogador exige a ativação do RightsVault por meio do depósito de stablecoins de caução (via depositCaution ou depositAndMint).",
                        "A rescisão antecipada do contrato antes de 6 meses + 1 dia aciona uma penalidade estrita de 65% / 35% governada de forma imutável on-chain pelo código do cofre, direcionando o montante da penalidade automaticamente com base na parte que rescindir.",
                        "Ao término do prazo contratual completo de 365 dias, 100% do valor da caução em custódia é devolvido ao Clube. O resgate de frações ERC-20 é processado proporcionalmente contra a reserva ativa."
                    ]
                },
                {
                    icon: <ShieldAlert className="h-6 w-6 text-primary" />,
                    title: "5. Isenção de Responsabilidade e Conformidade Regulatória",
                    paragraphs: [
                        "Conformidade com Leis Desportivas: As partes são inteiramente responsáveis pela adequação do registro de seus contratos junto às instituições desportivas (ex: FIFA TMS, FIFA Clearing House, boletins de federações nacionais como o BID da CBF). O ePass não valida conformidade desportiva.",
                        "Limitação de Responsabilidade: Não nos responsabilizamos por perdas financeiras, custos de gás, comprometimento de carteiras, bugs de software ou disputas contratuais entre jogadores, clubes e advogados."
                    ]
                }
            ],

            // --- PRIVACY SECTION ---
            privacyTitle: "Política de Privacidade",
            immutableWarningTitle: "Aviso Importante sobre Blockchain",
            immutableWarningText: "Ao registrar um acordo no ePass, certas provas criptográficas (assinaturas EIP-712), endereços de carteira pública, nonces, carimbos de data/hora (timestamps) e hashes de metadados são gravados permanentemente na blockchain pública do Ethereum e IPFS. Esses dados são imutáveis e não podem ser excluídos, modificados ou apagados, mesmo em caso de exclusão da conta. Os direitos tradicionais de exclusão de dados (como o 'Direito ao Esquecimento' da LGPD) não se aplicam aos dados gravados on-chain.",
            privacySections: [
                {
                    icon: <Shield className="h-6 w-6 text-primary" />,
                    title: "1. Informações que Coletamos",
                    paragraphs: [
                        "Dados Web3: Endereços de carteira pública, histórico de interação com contratos inteligentes, hashes de transações, registros de consumo de gás e assinaturas criptográficas (EIP-712).",
                        "Informações da Conta: Ao concluir o onboarding, coletamos seu nome legal completo, imagem de perfil (avatar), biografia, seleção de função (Jogador, Clube ou Advogado) e endereço de e-mail associado (obtido via autenticação do Google).",
                        "Metadados do Dispositivo: Logs de conexão técnica, versão do navegador, detalhes do sistema operacional e configurações de idioma para otimizar sua experiência na interface do dApp."
                    ]
                },
                {
                    icon: <Lock className="h-6 w-6 text-primary" />,
                    title: "2. Garantia Não-Custodial",
                    paragraphs: [
                        "O ePass é uma aplicação não-custodial. Nós nunca solicitamos, coletamos ou armazenamos as chaves privadas de sua carteira, frases semente (seed phrases) ou credenciais de segurança.",
                        "Todas as assinaturas criptográficas e execuções de transações ocorrem do lado do cliente por meio do provedor de carteira Web3 conectado. Você é o único responsável pela custódia e segurança de seus ativos digitais e credenciais."
                    ]
                },
                {
                    icon: <Database className="h-6 w-6 text-primary" />,
                    title: "3. Como Utilizamos seus Dados",
                    paragraphs: [
                        "Autenticação e Autorização: Validação de sua identidade via Next-Auth e SIWE para permitir ações protegidas no painel do usuário.",
                        "Indexação On-Chain: Leitura de eventos públicos da blockchain para construir seus portfólios ativos de jogador/clube, estatísticas de documentos e feeds de transações.",
                        "Comunicação e Conformidade: Viabilização de sistemas de notificação e garantia de que os acordos registrados estejam em conformidade com as regras estruturais dos contratos inteligentes."
                    ]
                },
                {
                    icon: <Globe className="h-6 w-6 text-primary" />,
                    title: "4. Compartilhamento e Visibilidade das Informações",
                    paragraphs: [
                        "Detalhes on-chain (NFTs Mestre emitidos, tokens fracionados, depósitos de caução e endereços de carteira ativos) são públicos e pesquisáveis por qualquer pessoa em exploradores de blocos públicos (como o Etherscan) e indexadores descentizados.",
                        "Detalhes pessoais off-chain, como o seu e-mail de autenticação, são mantidos sob estrito sigilo e nunca são vendidos, alugados ou distribuídos a terceiros para fins de marketing."
                    ]
                },
                {
                    icon: <RefreshCw className="h-6 w-6 text-primary" />,
                    title: "5. Seus Direitos (Conformidade com LGPD e GDPR)",
                    paragraphs: [
                        "Sob regulamentações como a LGPD (Brasil) e o GDPR (Europa), você tem o direito de acessar, retificar ou solicitar a exclusão de seus dados de perfil pessoal armazenados em nosso banco de dados tradicional (incluindo seu nome de perfil, bio e avatar).",
                        "Você reconhece e concorda explicitamente que esses direitos não se estendem, e não podem ser executados, sobre registros imutáveis gravados diretamente na blockchain ou arquivos distribuídos no IPFS que representam os metadados do contrato assinado."
                    ]
                }
            ]
        }
    };

    const tData = isPt ? content.pt : content.en;

    return (
        <div className="text-foreground min-h-screen w-full relative">
            <main className="relative min-h-screen h-full w-full flex flex-col justify-start items-center overflow-x-hidden pt-28 pb-16 px-4">
                <PublicNavbar />

                <div className="w-full max-w-4xl z-10 flex flex-col gap-6">
                    <div className="flex items-center gap-3">
                        <Link
                            href={status === "authenticated" ? "/home" : "/"}
                            className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors glass-input rounded-full px-4 py-2 border border-foreground/10"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            {tData.backButton}
                        </Link>
                    </div>

                    <FadeIn className="w-full">
                        <Card className="glass-panel p-6 md:p-10 rounded-3xl border border-foreground/10 flex flex-col gap-8 shadow-2xl transition-all duration-500 hover:border-primary/40 hover:shadow-[0_0_50px_oklch(from_var(--primary)_l_c_h_/_15%)]">
                            {/* Header */}
                            <div className="border-b border-foreground/10 pb-6">
                                <h1 className="text-2xl md:text-3xl font-serif font-light text-foreground mb-2">
                                    {tData.title}
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    {tData.subtitle}
                                </p>
                                <span className="text-xs text-muted-foreground/60 mt-4 block">
                                    {tData.lastUpdated}
                                </span>
                            </div>

                            {/* ========================================================================= */}
                            {/* TERMS OF SERVICE SECTION */}
                            {/* ========================================================================= */}
                            <div className="space-y-6">
                                <div className="border-b border-foreground/5 pb-2">
                                    <h2 className="text-xl md:text-2xl font-serif font-medium text-foreground tracking-tight flex items-center gap-2">
                                        <Scale className="w-5 h-5 text-primary" />
                                        {tData.termsTitle}
                                    </h2>
                                </div>

                                {/* Risk Warning Callout */}
                                <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-4 flex flex-col gap-2">
                                    <h3 className="text-sm font-semibold text-destructive flex items-center gap-2">
                                        <ShieldAlert className="w-4 h-4" />
                                        {tData.riskWarningTitle}
                                    </h3>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        {tData.riskWarningText}
                                    </p>
                                </div>

                                {/* Terms Subsections */}
                                <div className="flex flex-col gap-8">
                                    {tData.termsSections.map((section, idx) => (
                                        <div key={idx} className="flex gap-4 items-start border-b border-foreground/5 pb-6 last:border-0 last:pb-0">
                                            <div className="p-3 bg-primary/10 rounded-xl shrink-0">
                                                {section.icon}
                                            </div>
                                            <div className="space-y-3">
                                                <h3 className="text-md font-serif font-medium text-foreground">
                                                    {section.title}
                                                </h3>
                                                {section.paragraphs.map((p, pIdx) => (
                                                    <p key={pIdx} className="text-sm text-muted-foreground leading-relaxed">
                                                        {p}
                                                    </p>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Divider between Terms and Privacy */}
                            <div className="relative py-4">
                                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                    <div className="w-full border-t border-foreground/10" />
                                </div>
                                <div className="relative flex justify-center">
                                    <span className="bg-background/20 px-3 text-muted-foreground backdrop-blur-xl border border-foreground/10 rounded-full py-1 text-xs font-semibold flex items-center gap-1.5">
                                        <Shield className="w-3.5 h-3.5 text-primary" />
                                        &amp;
                                    </span>
                                </div>
                            </div>

                            {/* ========================================================================= */}
                            {/* PRIVACY POLICY SECTION */}
                            {/* ========================================================================= */}
                            <div className="space-y-6">
                                <div className="border-b border-foreground/5 pb-2">
                                    <h2 className="text-xl md:text-2xl font-serif font-medium text-foreground tracking-tight flex items-center gap-2">
                                        <Shield className="w-5 h-5 text-primary" />
                                        {tData.privacyTitle}
                                    </h2>
                                </div>

                                {/* Immutable Warning Callout */}
                                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex flex-col gap-2">
                                    <h3 className="text-sm font-semibold text-amber-500 flex items-center gap-2">
                                        <Lock className="w-4 h-4" />
                                        {tData.immutableWarningTitle}
                                    </h3>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        {tData.immutableWarningText}
                                    </p>
                                </div>

                                {/* Privacy Subsections */}
                                <div className="flex flex-col gap-8">
                                    {tData.privacySections.map((section, idx) => (
                                        <div key={idx} className="flex gap-4 items-start border-b border-foreground/5 pb-6 last:border-0 last:pb-0">
                                            <div className="p-3 bg-primary/10 rounded-xl shrink-0">
                                                {section.icon}
                                            </div>
                                            <div className="space-y-3">
                                                <h3 className="text-md font-serif font-medium text-foreground">
                                                    {section.title}
                                                </h3>
                                                {section.paragraphs.map((p, pIdx) => (
                                                    <p key={pIdx} className="text-sm text-muted-foreground leading-relaxed">
                                                        {p}
                                                    </p>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Card>
                    </FadeIn>
                </div>
            </main>
        </div>
    );
}
