const pupp = require("puppeteer");
const fs = require("fs");
const id = "koby16@yahoo.com";
const pass = "Gagangagan";
let input = process.argv[2];
let JobSearches = [];

async function main() {
    const browser = await pupp.launch({
        headless: false,
        defaultViewport: false,
        args: ["--start-maximized"]
    });
    let pages = await browser.pages();
    let tab = pages[0];
    await tab.goto("https://www.freelancer.com/login");
    await tab.type("input[type='email']", id);
    await tab.type("input[type='password']", pass);
    await tab.click("button[type='submit']");
    await tab.waitForSelector(".CallToAction fl-button[fltrackinglabel='ActivateFreelancerBrowseProjectsButton']", { visible: true });
    await tab.click(".CallToAction fl-button[fltrackinglabel='ActivateFreelancerBrowseProjectsButton']");
    await tab.waitForSelector(".search-result-item", { visible: true });
    await tab.type(".default-input.input-search.ng-pristine.ng-untouched.ng-valid", input);
    await tab.keyboard.press("Enter");
    let latestJobUrls = [];
    await tab.waitForSelector(".search-result-link", { visible: true });
    let latestJob = await tab.$$(".search-result-link");
    for (let i = 0; i < latestJob.length; i++) {
        let url = await tab.evaluate(function (ele) {
            return ele.getAttribute("href");
        }, latestJob[i]);
        latestJobUrls.push("https://www.freelancer.com" + url);
    }

    jobDetails(latestJobUrls, tab);
}

async function jobDetails(urls, tab) {
    for (let i = 0; i < urls.length; i++){
        await tab.goto(urls[i]);
        
        let jobDetails = {};
        await tab.waitForSelector("h1 > fl-text:nth-child(2) > span", { visible: true });
        let jobText = await tab.$("h1 > fl-text:nth-child(2) > span");
        let jobTitle = await tab.evaluate(function (ele) {
            return ele.textContent;
        }, jobText);
        
        let jobStipend = await tab.$("fl-card-header-right > fl-bit > app-project-details-budget > fl-bit > fl-text:nth-child(1) > div");
        let salary = await tab.evaluate(function (ele) {
            return ele.textContent;
        }, jobStipend);

        let projectDetail = await tab.$("span > fl-text > span");
        let detail = await tab.evaluate(function (ele) {
            return ele.textContent;
        }, projectDetail);
        
        let skillsReqTab = await tab.$$("fl-tag > fl-link > a > div > div > fl-text > span");
        let skills = [];
        for (let j = 0; j < skillsReqTab.length; j++){
            skill = await tab.evaluate(function (ele) {
                return ele.textContent;
            }, skillsReqTab[j]);
            skills.push(skill);
        }

        jobDetails['JobTitle'] = jobTitle;
        jobDetails['Salary'] = salary;
        jobDetails['Details'] = detail;
        jobDetails['Skills'] = skills;

        JobSearches.push(jobDetails);
    }

    fs.writeFileSync("JobSearches.json", JSON.stringify(JobSearches));
    await tab.close();
}
main();