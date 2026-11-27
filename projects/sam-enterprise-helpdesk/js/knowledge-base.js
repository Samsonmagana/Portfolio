
// ==============================================
// SAM ENTERPRISE - KNOWLEDGE BASE
// ==============================================


// ==============================================
// 1. KNOWLEDGE BASE ARTICLES
// ==============================================

const knowledgeArticles = [

    {
        id: "KB-001",
        title: "How to troubleshoot Wi-Fi connection problems",
        category: "Network",
        description: "Follow these steps when your computer cannot connect to your company's wireless network.",
        readTime: "4 min read",
        popular: true,
        tags: ["wifi", "wireless", "internet", "network", "connection"],
        warning: "Do not share your company Wi-Fi password with unauthorised people. Contact IT if you suspect that network credentials have been compromised.",
        steps: [
            {
                title: "Check your Wi-Fi connection",
                description: "Make sure Wi-Fi is switched on. On Windows, open Settings, select Network & Internet and check that Wi-Fi is enabled."
            },
            {
                title: "Check Airplane Mode",
                description: "Ensure Airplane Mode is disabled. When Airplane Mode is enabled, wireless connectivity may be unavailable."
            },
            {
                title: "Reconnect to the company network",
                description: "Open the available wireless networks, select your authorised company network and reconnect using the approved credentials."
            },
            {
                title: "Restart your network adapter",
                description: "If the connection still fails, try disabling and re-enabling your wireless network adapter through Windows network settings."
            },
            {
                title: "Check whether other users are affected",
                description: "Determine whether other employees are experiencing the same problem. This can help identify whether the issue affects one computer or the wider network."
            }
        ],
        result: "Your computer should be able to connect to the authorised company wireless network. If the problem continues, submit a Network & Internet support ticket."
    },

    {
        id: "KB-002",
        title: "How to reset your Windows password",
        category: "Accounts",
        description: "Guidance for employees who have forgotten their Windows or company network password.",
        readTime: "3 min read",
        popular: true,
        tags: ["password", "windows", "login", "account", "reset"],
        warning: "Never send your current password or password reset codes to a technician by email or chat. Use only company-approved password recovery procedures.",
        steps: [
            {
                title: "Identify the account problem",
                description: "Check whether you have forgotten your password or whether your account has been locked after multiple unsuccessful sign-in attempts."
            },
            {
                title: "Use the approved recovery option",
                description: "If your organisation provides an approved password recovery portal, access it using the official company link."
            },
            {
                title: "Follow identity verification",
                description: "Complete the identity verification steps provided by your organisation's approved recovery service."
            },
            {
                title: "Create a new password",
                description: "Follow your company's password policy. Use a unique password that is difficult for others to guess."
            },
            {
                title: "Sign in again",
                description: "Use your new password to sign in. Update saved credentials only through approved company processes."
            }
        ],
        result: "You should regain access to your account. If the account is locked or recovery is unavailable, contact the IT support team."
    },

    {
        id: "KB-003",
        title: "Troubleshooting printer and scanner problems",
        category: "Hardware",
        description: "Resolve common printing problems such as documents getting stuck, offline printers and failed print jobs.",
        readTime: "5 min read",
        popular: true,
        tags: ["printer", "scanner", "printing", "hardware", "paper"],
        warning: "Do not open electrical components or attempt internal hardware repairs unless authorised and trained to do so.",
        steps: [
            {
                title: "Check the printer power",
                description: "Confirm that the printer is switched on and that the power cable is properly connected."
            },
            {
                title: "Check paper and toner",
                description: "Ensure that paper is available, cartridges have sufficient toner or ink and there are no paper jams."
            },
            {
                title: "Check the printer connection",
                description: "Confirm that the printer is connected to the appropriate company network or computer."
            },
            {
                title: "Check the printer queue",
                description: "Open your computer's printer settings and inspect the print queue. Look for documents that may be paused or stuck."
            },
            {
                title: "Restart the printer",
                description: "If authorised, restart the printer and try printing a test page."
            }
        ],
        result: "The printer should accept and process print jobs. Contact IT if the printer remains offline or displays a hardware error."
    },

    {
        id: "KB-004",
        title: "How to troubleshoot company email problems",
        category: "Software",
        description: "Learn what to check when company email messages fail to send or receive.",
        readTime: "4 min read",
        popular: true,
        tags: ["email", "outlook", "mail", "office", "messages"],
        warning: "Never share your email password with anyone. Be cautious of unexpected password reset requests and suspicious attachments.",
        steps: [
            {
                title: "Check your internet connection",
                description: "Confirm that your computer can access the internet or the company network."
            },
            {
                title: "Check your email address",
                description: "Verify that the recipient's email address is correct and that there are no typing errors."
            },
            {
                title: "Check your mailbox storage",
                description: "If your mailbox has reached its storage limit, you may experience difficulties sending or receiving messages. Follow your organisation's mailbox management policy."
            },
            {
                title: "Check for service notifications",
                description: "Check your company's approved IT announcements for possible email service interruptions."
            },
            {
                title: "Contact IT Support",
                description: "If the problem continues, report the issue and include any error messages displayed by your email application."
            }
        ],
        result: "You should be able to send and receive emails normally. If the issue persists, submit an Email Problems ticket."
    },

    {
        id: "KB-005",
        title: "How to connect to a company VPN",
        category: "Network",
        description: "Understand the basic steps for connecting securely to your organisation's approved VPN.",
        readTime: "5 min read",
        popular: false,
        tags: ["vpn", "remote", "network", "connection", "secure"],
        warning: "Only use VPN applications and configuration details provided by your organisation. Never install unknown VPN software on a company device.",
        steps: [
            {
                title: "Confirm VPN access",
                description: "Check whether your job role has been authorised to use the organisation's VPN."
            },
            {
                title: "Check your internet connection",
                description: "Connect to a trusted internet connection before attempting to establish the VPN connection."
            },
            {
                title: "Open the approved VPN application",
                description: "Launch the VPN client installed or approved by your company's IT department."
            },
            {
                title: "Use your authorised credentials",
                description: "Follow the company's authentication process, including any required multi-factor authentication."
            },
            {
                title: "Verify the connection",
                description: "Confirm that the VPN application indicates a successful connection and follow your company's remote access policy."
            }
        ],
        result: "You should have a secure connection to the authorised company network. Contact IT if authentication or connection errors continue."
    },

    {
        id: "KB-006",
        title: "What to do when your computer becomes slow",
        category: "Hardware",
        description: "Basic troubleshooting steps for computers experiencing slow performance, freezing or unresponsive applications.",
        readTime: "4 min read",
        popular: false,
        tags: ["slow", "computer", "performance", "laptop", "freezing"],
        warning: "Do not delete company files, disable security software or install unapproved system-cleaning tools.",
        steps: [
            {
                title: "Check running applications",
                description: "Close applications that you are not using. Save your work before closing any application."
            },
            {
                title: "Check available storage",
                description: "Use Windows storage settings to review available disk space. Follow company procedures before removing any files."
            },
            {
                title: "Restart the computer",
                description: "Save your work and restart your computer if permitted. A restart may resolve temporary performance issues."
            },
            {
                title: "Check for unusual behaviour",
                description: "Notice whether the slowdown occurs when using a particular application, opening files or accessing the network."
            },
            {
                title: "Report persistent problems",
                description: "Contact IT support if your computer continues to freeze, crash or perform unusually."
            }
        ],
        result: "Your computer may become more responsive. Persistent performance issues may require further technical investigation."
    },

    {
        id: "KB-007",
        title: "How to identify and report suspicious emails",
        category: "Security",
        description: "Recognise common phishing signs and understand how to report suspicious messages safely.",
        readTime: "4 min read",
        popular: true,
        tags: ["phishing", "email", "fraud", "cybersecurity", "scam", "security"],
        warning: "Do not click suspicious links, open unexpected attachments or reply with passwords, banking information or verification codes.",
        steps: [
            {
                title: "Inspect the sender",
                description: "Check the sender's full email address. Be cautious of addresses that imitate company names or trusted organisations."
            },
            {
                title: "Look for unusual requests",
                description: "Be suspicious of unexpected requests involving payments, passwords, urgent account verification or confidential information."
            },
            {
                title: "Inspect links carefully",
                description: "Avoid clicking unexpected links. Contact the supposed sender using a trusted communication method if verification is needed."
            },
            {
                title: "Do not open suspicious attachments",
                description: "Unexpected files may contain malicious software. Do not download or open attachments you cannot verify."
            },
            {
                title: "Report the email",
                description: "Use your organisation's approved phishing-reporting process or contact the IT security team. Follow their instructions about preserving or deleting the message."
            }
        ],
        result: "The suspicious message will be handled through your organisation's security reporting process. If you have already clicked a suspicious link or entered credentials, contact IT security immediately."
    },

    {
        id: "KB-008",
        title: "How to request new software installation",
        category: "General",
        description: "Understand the approved procedure for requesting software or application installation on a company computer.",
        readTime: "3 min read",
        popular: false,
        tags: ["software", "installation", "application", "request", "program"],
        warning: "Do not install unlicensed, pirated or unauthorised software on company equipment.",
        steps: [
            {
                title: "Identify the software",
                description: "Record the full name of the software, its purpose and why you need it for your work."
            },
            {
                title: "Check whether the software is approved",
                description: "Check your company's approved software list or ask your department manager."
            },
            {
                title: "Submit a software request",
                description: "Use the company's approved IT service request process to request installation."
            },
            {
                title: "Wait for authorisation",
                description: "The appropriate manager or IT department may need to review licensing, security and compatibility requirements."
            },
            {
                title: "Arrange installation",
                description: "Once approved, follow the instructions provided by your IT department. Do not install the software independently unless authorised."
            }
        ],
        result: "The software request can be reviewed by the IT department. Installation will depend on company approval and licence availability."
    }

];


// ==============================================
// 2. PAGE ELEMENTS
// ==============================================

const knowledgeSearch =
    document.getElementById("knowledgeSearch");

const knowledgeSearchButton =
    document.getElementById("knowledgeSearchButton");

const knowledgeArticlesContainer =
    document.getElementById("knowledgeArticles");

const knowledgeEmpty =
    document.getElementById("knowledgeEmpty");

const articleTotal =
    document.getElementById("articleTotal");

const categoryButtons =
    document.querySelectorAll("[data-category]");

const popularSearchButtons =
    document.querySelectorAll("[data-search-term]");


// ==============================================
// 3. FILTER STATE
// ==============================================

let activeKnowledgeCategory = "All";

let currentSearchTerm = "";

let activeArticle = null;


// ==============================================
// 4. CATEGORY COUNTS
// ==============================================

function updateCategoryCounts() {

    const categoryElements = {

        Network: "networkCount",

        Hardware: "hardwareCount",

        Software: "softwareCount",

        Accounts: "accountsCount",

        Security: "securityCount",

        General: "generalCount"

    };


    Object.entries(categoryElements).forEach(
        ([category, elementId]) => {

            const count = knowledgeArticles.filter(
                article => article.category === category
            ).length;

            const element = document.getElementById(elementId);

            element.textContent =
                count + (count === 1 ? " article" : " articles");

        }
    );

}


// ==============================================
// 5. CREATE ARTICLE CARD
// ==============================================

function createArticleCard(article) {

    const card = document.createElement("button");

    card.type = "button";

    card.className = "knowledge-article-card";


    // Top section

    const top = document.createElement("div");

    top.className = "article-card-top";


    const category = document.createElement("span");

    category.className = "article-category-label";

    category.textContent = article.category;


    const reference = document.createElement("span");

    reference.className = "article-id";

    reference.textContent = article.id;


    top.appendChild(category);

    top.appendChild(reference);


    // Title

    const heading = document.createElement("h3");

    heading.textContent = article.title;


    // Description

    const description = document.createElement("p");

    description.textContent = article.description;


    // Footer

    const footer = document.createElement("div");

    footer.className = "article-card-footer";


    const readingTime = document.createElement("span");

    readingTime.textContent = article.readTime;


    const readMore = document.createElement("strong");

    readMore.textContent = "Read article";


    const arrow = document.createElement("i");

    arrow.setAttribute("data-lucide", "arrow-right");

    readMore.appendChild(arrow);


    footer.appendChild(readingTime);

    footer.appendChild(readMore);


    card.appendChild(top);

    card.appendChild(heading);

    card.appendChild(description);

    card.appendChild(footer);


    card.addEventListener("click", function () {

        openKnowledgeArticle(article.id);

    });


    return card;

}


// ==============================================
// 6. DISPLAY ARTICLES
// ==============================================

function renderKnowledgeArticles() {

    if (!knowledgeArticlesContainer) {
        return;
    }


    const filteredArticles = knowledgeArticles.filter(article => {

        const matchesCategory =
            activeKnowledgeCategory === "All" ||
            article.category === activeKnowledgeCategory;


        const searchableContent = [

            article.id,

            article.title,

            article.description,

            article.category,

            ...article.tags,

            ...article.steps.map(step =>
                step.title + " " + step.description
            )

        ].join(" ").toLowerCase();


        const matchesSearch =
            searchableContent.includes(currentSearchTerm);


        return matchesCategory && matchesSearch;

    });


    // Popular articles appear first when no specific
    // category or search is selected.

    if (
        activeKnowledgeCategory === "All" &&
        currentSearchTerm === ""
    ) {

        filteredArticles.sort((a, b) =>
            Number(b.popular) - Number(a.popular)
        );

    }


    knowledgeArticlesContainer.replaceChildren();


    filteredArticles.forEach(article => {

        const card = createArticleCard(article);

        knowledgeArticlesContainer.appendChild(card);

    });


    articleTotal.textContent =
        filteredArticles.length +
        (filteredArticles.length === 1 ? " article" : " articles");


    knowledgeEmpty.classList.toggle(
        "show",
        filteredArticles.length === 0
    );


    if (window.lucide) {
        lucide.createIcons();
    }

}


// ==============================================
// 7. CATEGORY FILTERING
// ==============================================

categoryButtons.forEach(button => {

    button.addEventListener("click", function () {

        activeKnowledgeCategory = this.dataset.category;

        categoryButtons.forEach(categoryButton => {

            categoryButton.classList.remove("selected");

        });

        this.classList.add("selected");

        renderKnowledgeArticles();

    });

});


// ==============================================
// 8. SEARCH FUNCTIONALITY
// ==============================================

function searchKnowledgeBase() {

    currentSearchTerm =
        knowledgeSearch.value.toLowerCase().trim();

    renderKnowledgeArticles();

}


if (knowledgeSearch) {

    knowledgeSearch.addEventListener(
        "input",
        searchKnowledgeBase
    );

    knowledgeSearch.addEventListener("keydown", function(event) {

        if (event.key === "Enter") {

            searchKnowledgeBase();

        }

    });

}


if (knowledgeSearchButton) {

    knowledgeSearchButton.addEventListener(
        "click",
        searchKnowledgeBase
    );

}


// ==============================================
// 9. POPULAR SEARCH BUTTONS
// ==============================================

popularSearchButtons.forEach(button => {

    button.addEventListener("click", function() {

        knowledgeSearch.value = this.dataset.searchTerm;

        activeKnowledgeCategory = "All";

        categoryButtons.forEach(item => {

            item.classList.remove("selected");

        });

        searchKnowledgeBase();

    });

});


// ==============================================
// 10. RESET FILTERS
// ==============================================

function resetKnowledgeFilters() {

    activeKnowledgeCategory = "All";

    currentSearchTerm = "";

    knowledgeSearch.value = "";


    categoryButtons.forEach(button => {

        button.classList.remove("selected");

    });


    renderKnowledgeArticles();

}


document.getElementById("showAllArticles")
    .addEventListener("click", resetKnowledgeFilters);


document.getElementById("resetKnowledge")
    .addEventListener("click", resetKnowledgeFilters);


// ==============================================
// 11. ARTICLE MODAL ELEMENTS
// ==============================================

const articleModal =
    document.getElementById("articleModal");

const articleModalBody =
    document.getElementById("articleModalBody");

const articleReference =
    document.getElementById("articleReference");

const closeArticleModal =
    document.getElementById("closeArticleModal");

const feedbackMessage =
    document.getElementById("feedbackMessage");

const helpfulYes =
    document.getElementById("helpfulYes");

const helpfulNo =
    document.getElementById("helpfulNo");


// ==============================================
// 12. CREATE AN ARTICLE STEP
// ==============================================

function createArticleStep(step, index) {

    const stepElement = document.createElement("div");

    stepElement.className = "article-step";


    const number = document.createElement("div");

    number.className = "article-step-number";

    number.textContent = index + 1;


    const content = document.createElement("div");


    const heading = document.createElement("h4");

    heading.textContent = step.title;


    const description = document.createElement("p");

    description.textContent = step.description;


    content.appendChild(heading);

    content.appendChild(description);


    stepElement.appendChild(number);

    stepElement.appendChild(content);


    return stepElement;

}


// ==============================================
// 13. DISPLAY FULL ARTICLE
// ==============================================

function openKnowledgeArticle(articleId) {

    const article = knowledgeArticles.find(
        item => item.id === articleId
    );

    if (!article) {
        return;
    }


    activeArticle = article;


    articleReference.textContent = article.id;


    articleModalBody.replaceChildren();


    // Category

    const category = document.createElement("div");

    category.className = "article-detail-category";

    category.textContent =
        `${article.category} · ${article.readTime}`;


    // Title

    const heading = document.createElement("h2");

    heading.textContent = article.title;


    // Description

    const description = document.createElement("p");

    description.className = "article-detail-description";

    description.textContent = article.description;


    articleModalBody.appendChild(category);

    articleModalBody.appendChild(heading);

    articleModalBody.appendChild(description);


    // Warning

    if (article.warning) {

        const warning = document.createElement("div");

        warning.className = "article-warning";


        const warningIcon = document.createElement("i");

        warningIcon.setAttribute("data-lucide", "alert-triangle");


        const warningText = document.createElement("p");

        warningText.textContent = article.warning;


        warning.appendChild(warningIcon);

        warning.appendChild(warningText);


        articleModalBody.appendChild(warning);

    }


    // Troubleshooting section

    const stepsHeading = document.createElement("h3");

    stepsHeading.textContent = "Step-by-step instructions";

    stepsHeading.style.fontSize = "14px";

    stepsHeading.style.marginBottom = "10px";


    articleModalBody.appendChild(stepsHeading);


    article.steps.forEach((step, index) => {

        articleModalBody.appendChild(
            createArticleStep(step, index)
        );

    });


    // Expected result

    const result = document.createElement("div");

    result.className = "article-expected-result";


    const resultHeading = document.createElement("h4");

    resultHeading.textContent = "Expected Result";


    const resultDescription = document.createElement("p");

    resultDescription.textContent = article.result;


    result.appendChild(resultHeading);

    result.appendChild(resultDescription);


    articleModalBody.appendChild(result);


    // Reset feedback interface

    prepareArticleFeedback(article.id);


    articleModal.classList.add("show");


    if (window.lucide) {
        lucide.createIcons();
    }

}


// ==============================================
// 14. ARTICLE FEEDBACK STORAGE
// ==============================================

const FEEDBACK_STORAGE_KEY = "samEnterpriseKnowledgeFeedback";


function getKnowledgeFeedback() {

    try {

        const saved = localStorage.getItem(FEEDBACK_STORAGE_KEY);

        return saved ? JSON.parse(saved) : {};

    } catch (error) {

        console.error("Unable to retrieve article feedback:", error);

        return {};

    }

}


function prepareArticleFeedback(articleId) {

    const previousFeedback = getKnowledgeFeedback();

    const existingFeedback = previousFeedback[articleId];

    const existingVote = existingFeedback?.vote;


    feedbackMessage.textContent = "";


    helpfulYes.disabled = Boolean(existingVote);

    helpfulNo.disabled = Boolean(existingVote);


    helpfulYes.classList.toggle(
        "selected",
        existingVote === "yes"
    );

    helpfulNo.classList.toggle(
        "selected",
        existingVote === "no"
    );


    if (existingVote) {

        feedbackMessage.textContent =
            "Thank you. Your feedback has already been recorded for this article.";

    }

}


// ==============================================
// 15. SAVE ARTICLE FEEDBACK
// ==============================================

function submitKnowledgeFeedback(vote) {

    if (!activeArticle) {
        return;
    }


    const feedback = getKnowledgeFeedback();


    if (feedback[activeArticle.id]) {

        feedbackMessage.textContent =
            "You have already submitted feedback for this article.";

        return;

    }


    feedback[activeArticle.id] = {

        vote: vote,

        articleId: activeArticle.id,

        createdAt: new Date().toISOString()

    };


    try {

        localStorage.setItem(
            FEEDBACK_STORAGE_KEY,
            JSON.stringify(feedback)
        );


        helpfulYes.disabled = true;

        helpfulNo.disabled = true;


        helpfulYes.classList.toggle(
            "selected",
            vote === "yes"
        );

        helpfulNo.classList.toggle(
            "selected",
            vote === "no"
        );


        feedbackMessage.textContent =
            "Thank you! Your feedback has been recorded.";


    } catch (error) {

        console.error("Unable to save feedback:", error);

        feedbackMessage.textContent =
            "Your feedback could not be saved in browser storage.";

    }

}


helpfulYes.addEventListener("click", function() {

    submitKnowledgeFeedback("yes");

});


helpfulNo.addEventListener("click", function() {

    submitKnowledgeFeedback("no");

});


// ==============================================
// 16. CLOSE ARTICLE MODAL
// ==============================================

function closeKnowledgeArticle() {

    articleModal.classList.remove("show");

    activeArticle = null;

}


closeArticleModal.addEventListener(
    "click",
    closeKnowledgeArticle
);


articleModal.addEventListener("click", function(event) {

    if (event.target === articleModal) {

        closeKnowledgeArticle();

    }

});


document.addEventListener("keydown", function(event) {

    if (
        event.key === "Escape" &&
        articleModal.classList.contains("show")
    ) {

        closeKnowledgeArticle();

    }

});


// ==============================================
// 17. INITIALISE KNOWLEDGE BASE
// ==============================================

updateCategoryCounts();

renderKnowledgeArticles();


if (window.lucide) {
    lucide.createIcons();
}
