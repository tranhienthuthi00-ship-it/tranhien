import React, { useState } from "react";
import { Plus, Check, Info, BookOpen } from "lucide-react";
import type { Word } from "@/types";
import { cn } from "@/lib/utils";

interface CEFRWord {
  vocabulary: string;
  wordType: string;
  ipa: string;
  definition: string;
  example: string;
}

const CEFR_DATA: Record<string, CEFRWord[]> = {
  "A1": [
    { vocabulary: "Always", wordType: "adv", ipa: "/ˈɔːlweɪz/", definition: "At all times; on all occasions.", example: "I always brush my teeth before bed." },
    { vocabulary: "Family", wordType: "noun", ipa: "/ˈfæməli/", definition: "A group of one or more parents and their children living together as a unit.", example: "I love spending time with my family." },
    { vocabulary: "Friend", wordType: "noun", ipa: "/frend/", definition: "A person whom one knows and with whom one has a bond of mutual affection.", example: "Sarah is my best friend." },
    { vocabulary: "Happy", wordType: "adj", ipa: "/ˈhæpi/", definition: "Feeling or showing pleasure or contentment.", example: "The children look very happy today." },
    { vocabulary: "Learn", wordType: "verb", ipa: "/lɜːrn/", definition: "Gain or acquire knowledge of or skill in (something) by study, experience, or being taught.", example: "I am learning English." },
    { vocabulary: "School", wordType: "noun", ipa: "/skuːl/", definition: "An institution for educating children.", example: "He goes to school every morning." },
    { vocabulary: "Water", wordType: "noun", ipa: "/ˈwɔːtər/", definition: "A colorless, transparent, odorless liquid that forms the seas, lakes, rivers, and rain.", example: "Please drink plenty of water." },
    { vocabulary: "Work", wordType: "verb", ipa: "/wɜːrk/", definition: "Be engaged in physical or mental effort in order to achieve a purpose or result.", example: "She works at a hospital." },
    { vocabulary: "Beautiful", wordType: "adj", ipa: "/ˈbjuːtɪfl/", definition: "Pleasing the senses or mind aesthetically.", example: "The sunset over the ocean was beautiful." },
    { vocabulary: "Breakfast", wordType: "noun", ipa: "/ˈbrekfəst/", definition: "A meal eaten in the morning, the first of the day.", example: "I usually have eggs for breakfast." },
    { vocabulary: "Coffee", wordType: "noun", ipa: "/ˈkɒfi/", definition: "A hot drink made from the roasted and ground seeds of a tropical shrub.", example: "I can't start my day without a cup of coffee." },
    { vocabulary: "Evening", wordType: "noun", ipa: "/ˈiːvnɪŋ/", definition: "The period of time at the end of the day, usually from about 6 p.m. to bedtime.", example: "We like to go for a walk in the evening." },
    { vocabulary: "Journey", wordType: "noun", ipa: "/ˈdʒɜːni/", definition: "An act of traveling from one place to another.", example: "It was a long journey across the desert." },
    { vocabulary: "Morning", wordType: "noun", ipa: "/ˈmɔːnɪŋ/", definition: "The period of time between sunrise and noon.", example: "The sun shines brightly in the morning." },
    { vocabulary: "Parents", wordType: "noun", ipa: "/ˈpeərənts/", definition: "A father or mother.", example: "My parents are visiting us this weekend." },
    { vocabulary: "People", wordType: "noun", ipa: "/ˈpiːpl/", definition: "Human beings in general or considered as a group.", example: "There were many people at the concert." },
    { vocabulary: "Simple", wordType: "adj", ipa: "/ˈsɪmpl/", definition: "Easily understood or done; presenting no difficulty.", example: "The instructions were very simple to follow." },
    { vocabulary: "Vegetable", wordType: "noun", ipa: "/ˈvedʒtəbl/", definition: "A plant or part of a plant used as food.", example: "You should eat more green vegetables." },
    { vocabulary: "Animal", wordType: "noun", ipa: "/ˈænɪml/", definition: "A living organism that feeds on organic matter.", example: "The tiger is a powerful animal." },
    { vocabulary: "Answer", wordType: "verb", ipa: "/ˈænsər/", definition: "A thing said or written in reaction to a question.", example: "Please answer the question." },
    { vocabulary: "Apple", wordType: "noun", ipa: "/ˈæpl/", definition: "A round fruit with red or green skin and whitish flesh.", example: "An apple a day keeps the doctor away." },
    { vocabulary: "April", wordType: "noun", ipa: "/ˈeɪprəl/", definition: "The fourth month of the year.", example: "April showers bring May flowers." },
    { vocabulary: "Area", wordType: "noun", ipa: "/ˈeəriə/", definition: "A region or part of a town, country, or the world.", example: "There are many parks in this area." },
    { vocabulary: "Arm", wordType: "noun", ipa: "/ɑːrm/", definition: "Each of the two upper limbs of the human body.", example: "He broke his arm during the game." },
    { vocabulary: "Art", wordType: "noun", ipa: "/ɑːrt/", definition: "The expression or application of human creative skill.", example: "She is studying fine art at university." },
    { vocabulary: "August", wordType: "noun", ipa: "/ˈɔːɡəst/", definition: "The eighth month of the year.", example: "We usually go on vacation in August." },
    { vocabulary: "Baby", wordType: "noun", ipa: "/ˈbeɪbi/", definition: "A very young child or animal.", example: "The baby is sleeping peacefully." },
    { vocabulary: "Bank", wordType: "noun", ipa: "/bæŋk/", definition: "A financial establishment that invests money.", example: "I need to go to the bank to withdraw some cash." },
    { vocabulary: "Big", wordType: "adj", ipa: "/bɪɡ/", definition: "Of considerable size, extent, or intensity.", example: "That is a very big dog." },
    { vocabulary: "Bird", wordType: "noun", ipa: "/bɜːrd/", definition: "A warm-blooded egg-laying vertebrate.", example: "The bird is singing in the tree." },
    { vocabulary: "Birthday", wordType: "noun", ipa: "/ˈbɜːθdeɪ/", definition: "The anniversary of the day on which a person was born.", example: "When is your birthday?" },
    { vocabulary: "Black", wordType: "adj/noun", ipa: "/blæk/", definition: "Of the very darkest color.", example: "He wore a black suit to the wedding." },
    { vocabulary: "Blue", wordType: "adj/noun", ipa: "/bluː/", definition: "Of a color intermediate between green and violet.", example: "The sky is blue today." },
    { vocabulary: "Body", wordType: "noun", ipa: "/ˈbɒdi/", definition: "The physical structure of a person or an animal.", example: "He has a very strong body." },
    { vocabulary: "Book", wordType: "noun", ipa: "/bʊk/", definition: "A written or printed work consisting of pages.", example: "I am reading an interesting book." },
    { vocabulary: "Box", wordType: "noun", ipa: "/bɒks/", definition: "A container with a flat base and sides.", example: "The gift was in a small box." },
    { vocabulary: "Bread", wordType: "noun", ipa: "/bred/", definition: "Food made of flour, water, and yeast.", example: "I have some bread and butter for breakfast." },
    { vocabulary: "Brother", wordType: "noun", ipa: "/ˈbrʌðər/", definition: "A man or boy in relation to other sons and daughters of his parents.", example: "I have two brothers and one sister." },
  ],
  "A2": [
    { vocabulary: "Advice", wordType: "noun", ipa: "/ədˈvaɪs/", definition: "Guidance or recommendations offered with regard to prudent future action.", example: "I need some advice on which car to buy." },
    { vocabulary: "Believe", wordType: "verb", ipa: "/bɪˈliːv/", definition: "Accept (something) as true; feel sure of the truth of.", example: "I believe everything happen for a reason." },
    { vocabulary: "Comfortable", wordType: "adj", ipa: "/ˈkʌmftəbl/", definition: "(especially of clothes or furnishings) providing physical ease and relaxation.", example: "This sofa is very comfortable." },
    { vocabulary: "Decision", wordType: "noun", ipa: "/dɪˈsɪʒn/", definition: "A conclusion or resolution reached after consideration.", example: "I haven't made a decision yet." },
    { vocabulary: "Experience", wordType: "noun", ipa: "/ɪkˈspɪəriəns/", definition: "Practical contact with and observation of facts or events.", example: "I have five years of experience in marketing." },
    { vocabulary: "Healthy", wordType: "adj", ipa: "/ˈhelθi/", definition: "In good health.", example: "Eating vegetables is part of a healthy diet." },
    { vocabulary: "Modern", wordType: "adj", ipa: "/ˈmɒdn/", definition: "Relating to the present or recent times as opposed to the remote past.", example: "I like living in a modern apartment." },
    { vocabulary: "Possible", wordType: "adj", ipa: "/ˈpɒsəbl/", definition: "Able to be done or achieved to happen.", example: "Is it possible to finish this by Friday?" },
    { vocabulary: "Appearance", wordType: "noun", ipa: "/əˈpɪərəns/", definition: "The way that someone or something looks.", example: "She cares a lot about her physical appearance." },
    { vocabulary: "Environment", wordType: "noun", ipa: "/ɪnˈvaɪrənmənt/", definition: "The surroundings or conditions in which a person, animal, or plant lives.", example: "We must protect the natural environment." },
    { vocabulary: "Furniture", wordType: "noun", ipa: "/ˈfɜːrnɪtʃər/", definition: "The movable articles used to make a room suitable for living.", example: "They bought some new furniture for the living room." },
    { vocabulary: "Imagine", wordType: "verb", ipa: "/ɪˈmædʒɪn/", definition: "Form a mental image or concept of.", example: "Can you imagine living on Mars?" },
    { vocabulary: "Meaning", wordType: "noun", ipa: "/ˈmiːnɪŋ/", definition: "What is meant by a word, text, concept, or action.", example: "What is the meaning of this word?" },
    { vocabulary: "Opinion", wordType: "noun", ipa: "/əˈpɪnjən/", definition: "A view or judgment formed about something, not necessarily based on fact.", example: "In my opinion, this is the best choice." },
    { vocabulary: "Reason", wordType: "noun", ipa: "/ˈriːzn/", definition: "A cause, explanation, or justification for an action or event.", example: "The reason for the delay is still unknown." },
    { vocabulary: "Suddenly", wordType: "adv", ipa: "/ˈsʌdənli/", definition: "Quickly and unexpectedly.", example: "Suddenly, the lights went out." },
    { vocabulary: "Technology", wordType: "noun", ipa: "/tekˈnɒlədʒi/", definition: "The application of scientific knowledge for practical purposes.", example: "Technology is changing the way we communicate." },
    { vocabulary: "Unique", wordType: "adj", ipa: "/juːˈniːk/", definition: "Being the only one of its kind; unlike anything else.", example: "Each fingerprint is unique." },
    { vocabulary: "Actually", wordType: "adv", ipa: "/ˈæktʃuəli/", definition: "Used to emphasize that something is a fact.", example: "Actually, I've never been there before." },
    { vocabulary: "Adventure", wordType: "noun", ipa: "/ədˈventʃər/", definition: "An unusual and exciting experience.", example: "Our trip to Africa was a great adventure." },
    { vocabulary: "Agree", wordType: "verb", ipa: "/əˈɡriː/", definition: "Have the same opinion about something.", example: "I agree with your suggestion." },
    { vocabulary: "Airport", wordType: "noun", ipa: "/ˈeəpɔːt/", definition: "A complex of runways and buildings for the take-off and landing of aircraft.", example: "We arrived at the airport two hours early." },
    { vocabulary: "Album", wordType: "noun", ipa: "/ˈælbəm/", definition: "A collection of recordings issued as a single item.", example: "Have you heard her new album yet?" },
    { vocabulary: "Almost", wordType: "adv", ipa: "/ˈɔːlməʊst/", definition: "Not quite; very nearly.", example: "The dinner is almost ready." },
    { vocabulary: "Amazing", wordType: "adj", ipa: "/əˈmeɪzɪŋ/", definition: "Causing great surprise or wonder.", example: "The view from the top was amazing." },
    { vocabulary: "Amount", wordType: "noun", ipa: "/əˈmaʊnt/", definition: "A quantity of something.", example: "A large amount of money was spent." },
    { vocabulary: "Angry", wordType: "adj", ipa: "/ˈæŋɡri/", definition: "Feeling or showing strong annoyance.", example: "He was angry because I was late." },
    { vocabulary: "Another", wordType: "det/pron", ipa: "/əˈnʌðər/", definition: "Used to refer to an additional person or thing.", example: "Would you like another cup of tea?" },
    { vocabulary: "Area", wordType: "noun", ipa: "/ˈeəriə/", definition: "A region or part of a town, country, or the world.", example: "There are many parks in this area." },
    { vocabulary: "Arm", wordType: "noun", ipa: "/ɑːrm/", definition: "Each of the two upper limbs of the human body.", example: "He broke his arm during the game." },
    { vocabulary: "Army", wordType: "noun", ipa: "/ˈɑːmi/", definition: "An organized military force equipped for fighting on land.", example: "He decided to join the army." },
    { vocabulary: "Around", wordType: "prep/adv", ipa: "/əraʊnd/", definition: "Located or situated on every side.", example: "The moon travels around the earth." },
    { vocabulary: "Arrive", wordType: "verb", ipa: "/əraɪv/", definition: "Reach a destination at the end of a journey.", example: "The train will arrive at 10 a.m." },
    { vocabulary: "As", wordType: "prep/conj", ipa: "/æz/", definition: "Used in comparisons to refer to degree or amount.", example: "He is as tall as his father." },
    { vocabulary: "Ask", wordType: "verb", ipa: "/ɑːsk/", definition: "Say something in order to obtain information.", example: "Can I ask you a question?" },
    { vocabulary: "At", wordType: "prep", ipa: "/æt/", definition: "Expressing location or arrival in a particular place.", example: "I'll meet you at the station." },
    { vocabulary: "Aunt", wordType: "noun", ipa: "/ɑːnt/", definition: "The sister of one's father or mother.", example: "My aunt lives in New York." },
    { vocabulary: "Autumn", wordType: "noun", ipa: "/ˈɔːtəm/", definition: "The season after summer and before winter.", example: "The leaves change color in autumn." },
  ],
  "B1": [
    { vocabulary: "Achievement", wordType: "noun", ipa: "/əˈtʃiːvmənt/", definition: "A thing done successfully, typically by effort, courage, or skill.", example: "The new bridge is a great engineering achievement." },
    { vocabulary: "Challenge", wordType: "noun", ipa: "/ˈtʃælɪndʒ/", definition: "A task or situation that tests someone's abilities.", example: "Climbing Mount Everest was a huge challenge." },
    { vocabulary: "Description", wordType: "noun", ipa: "/dɪˈskrɪpʃn/", definition: "A spoken or written representation or account of a person, object, or event.", example: "Can you give me a description of the thief?" },
    { vocabulary: "Education", wordType: "noun", ipa: "/ˌedʒuˈkeɪʃn/", definition: "The process of receiving or giving systematic instruction.", example: "Education is the key to success." },
    { vocabulary: "Furniture", wordType: "noun", ipa: "/ˈfɜːrnɪtʃər/", definition: "The movable articles that are used to make a room or building suitable for living or working in.", example: "The room was empty of furniture." },
    { vocabulary: "Identify", wordType: "verb", ipa: "/aɪˈdentɪfaɪ/", definition: "Establish or indicate who or what (someone or something) is.", example: "Can you identify your luggage?" },
    { vocabulary: "Option", wordType: "noun", ipa: "/ˈɒpʃn/", definition: "A thing that is or may be chosen.", example: "We have several options for dinner." },
    { vocabulary: "Situation", wordType: "noun", ipa: "/ˌsɪtʃuˈeɪʃn/", definition: "A set of circumstances in which one finds oneself.", example: "I find myself in a difficult situation." },
    { vocabulary: "Advantage", wordType: "noun", ipa: "/ədˈvɑːntɪdʒ/", definition: "A condition or circumstance that puts one in a favorable or superior position.", example: "Being bilingual is a huge advantage in the job market." },
    { vocabulary: "Community", wordType: "noun", ipa: "/kəˈmjuːnəti/", definition: "A group of people living in the same place or having a particular characteristic in common.", example: "The local community worked together to clean the park." },
    { vocabulary: "Difference", wordType: "noun", ipa: "/ˈdɪfrəns/", definition: "A point or way in which people or things are not the same.", example: "There is a big difference between these two products." },
    { vocabulary: "Individual", wordType: "noun", ipa: "/ˌɪndɪˈvɪdʒuəl/", definition: "A single human being as distinct from a group.", example: "We must respect the rights of the individual." },
    { vocabulary: "Opportunity", wordType: "noun", ipa: "/ˌɒpəˈtjuːnəti/", definition: "A set of circumstances that makes it possible to do something.", example: "This is a great opportunity to learn new skills." },
    { vocabulary: "Previous", wordType: "adj", ipa: "/ˈpriːviəs/", definition: "Existing or occurring before in time or order.", example: "In the previous chapter, we discussed the history of art." },
    { vocabulary: "Responsibility", wordType: "noun", ipa: "/rɪˌspɒnsəˈbɪləti/", definition: "The state or fact of having a duty to deal with something.", example: "It's your responsibility to finish the report on time." },
    { vocabulary: "Strategy", wordType: "noun", ipa: "/ˈstrætədʒi/", definition: "A plan of action designed to achieve a long-term or overall aim.", example: "The company needs a new marketing strategy." },
    { vocabulary: "Theory", wordType: "noun", ipa: "/ˈθɪəri/", definition: "A system of ideas intended to explain something.", example: "Darwin's theory of evolution changed the world." },
    { vocabulary: "Valuable", wordType: "adj", ipa: "/ˈvæljuəbl/", definition: "Worth a great deal of money or extremely useful.", example: "Time is a valuable resource." },
    { vocabulary: "Acceptable", wordType: "adj", ipa: "/əkˈseptəbl/", definition: "Able to be agreed on; suitable.", example: "We need to find an acceptable solution for everyone." },
    { vocabulary: "Accommodate", wordType: "verb", ipa: "/əˈkɒmədeɪt/", definition: "(of a building) provide lodging or sufficient space for.", example: "The hotel can accommodate up to 500 guests." },
    { vocabulary: "According", wordType: "adv", ipa: "/əˈkɔːrdɪŋ/", definition: "As stated by or in.", example: "According to the weather forecast, it will rain tomorrow." },
    { vocabulary: "Accuracy", wordType: "noun", ipa: "/ˈækjərəsi/", definition: "The quality or state of being correct or precise.", example: "The accuracy of the results is very important." },
    { vocabulary: "Actually", wordType: "adv", ipa: "/ˈæktʃuəli/", definition: "Used to emphasize that something is a fact.", example: "Actually, I don't know the answer." },
    { vocabulary: "Advertise", wordType: "verb", ipa: "/ˈædvətaɪz/", definition: "Describe or draw attention to (a product, service, or event) in a public medium.", example: "They are advertising for a new manager." },
    { vocabulary: "Afford", wordType: "verb", ipa: "/əˈfɔːrd/", definition: "Have enough money to pay for.", example: "I can't afford to buy a new car right now." },
    { vocabulary: "Agency", wordType: "noun", ipa: "/ˈeɪdʒənsi/", definition: "A business or organization established to provide a particular service.", example: "I booked my trip through a travel agency." },
    { vocabulary: "Agreement", wordType: "noun", ipa: "/əˈɡriːmənt/", definition: "A negotiated and typically legally binding arrangement.", example: "They signed a trade agreement yesterday." },
    { vocabulary: "Alcohol", wordType: "noun", ipa: "/ˈælkəhɒl/", definition: "A colorless volatile flammable liquid which is the intoxicating constituent of wine, beer, spirits, and other drinks.", example: "The doctor advised him to avoid alcohol." },
    { vocabulary: "Amazing", wordType: "adj", ipa: "/əˈmeɪzɪŋ/", definition: "Causing great surprise or wonder.", example: "The view from the top of the mountain was amazing." },
    { vocabulary: "Ambition", wordType: "noun", ipa: "/æmˈbɪʃn/", definition: "A strong desire to do or achieve something.", example: "Her ambition is to become a doctor." },
    { vocabulary: "Amusing", wordType: "adj", ipa: "/əˈmjuːzɪŋ/", definition: "Causing laughter or providing entertainment.", example: "I found the movie very amusing." },
    { vocabulary: "Analyze", wordType: "verb", ipa: "/ˈænəlaɪz/", definition: "Examine methodically and in detail.", example: "The scientists need to analyze the results of the experiment." },
    { vocabulary: "Ancient", wordType: "adj", ipa: "/ˈeɪnʃənt/", definition: "Belonging to the very distant past.", example: "They are studying ancient history." },
    { vocabulary: "Annoy", wordType: "verb", ipa: "/əˈnɔɪ/", definition: "Make (someone) a little angry; irritate.", example: "The loud noise started to annoy me." },
    { vocabulary: "Annual", wordType: "adj", ipa: "/ˈænjuəl/", definition: "Occurring once every year.", example: "The company holds an annual meeting." },
    { vocabulary: "Antique", wordType: "adj/noun", ipa: "/ænˈtiːk/", definition: "A collectible object such as a piece of furniture.", example: "She has a collection of antique clocks." },
    { vocabulary: "Anxiety", wordType: "noun", ipa: "/æŋˈzaɪəti/", definition: "A feeling of worry, nervousness, or unease.", example: "He suffers from anxiety before public speaking." },
    { vocabulary: "Apparent", wordType: "adj", ipa: "/əˈpærənt/", definition: "Clearly visible or understood; obvious.", example: "The reason for his anger was apparent to everyone." },
  ],
  "B2": [
    { vocabulary: "Alternative", wordType: "adj", ipa: "/ɔːlˈtɜːrnətɪv/", definition: "(of one or more things) available as another possibility.", example: "We have an alternative plan if it rains." },
    { vocabulary: "Consequence", wordType: "noun", ipa: "/ˈkɒnsɪkwəns/", definition: "A result or effect of an action or condition.", example: "The increase in temperature is a consequence of global warming." },
    { vocabulary: "Essentially", wordType: "adv", ipa: "/ɪˈsenʃəli/", definition: "Used to emphasize the basic, fundamental, or primary nature of something.", example: "Essentially, they are asking for more money." },
    { vocabulary: "Hypothesis", wordType: "noun", ipa: "/haɪˈpɒθəsɪs/", definition: "A supposition or proposed explanation made on the basis of limited evidence.", example: "The scientists set out to test their hypothesis." },
    { vocabulary: "Innocent", wordType: "adj", ipa: "/ˈɪnəsnt/", definition: "Not guilty of a crime or offense.", example: "The man was found innocent of all charges." },
    { vocabulary: "Persuade", wordType: "verb", ipa: "/pəˈsweɪd/", definition: "Cause (someone) to do something through reasoning or argument.", example: "I managed to persuade him to come with us." },
    { vocabulary: "Relevant", wordType: "adj", ipa: "/ˈreləvənt/", definition: "Closely connected or appropriate to what is being done or considered.", example: "The comments were not relevant to the discussion." },
    { vocabulary: "Variation", wordType: "noun", ipa: "/ˌveəriˈeɪʃn/", definition: "A change or difference in condition, amount, or level.", example: "The dictionary lists several variations of the word." },
    { vocabulary: "Capacity", wordType: "noun", ipa: "/kəˈpæsəti/", definition: "The maximum amount that something can contain.", example: "The stadium has a seating capacity of 50,000." },
    { vocabulary: "Distinguish", wordType: "verb", ipa: "/dɪˈstɪŋɡwɪʃ/", definition: "Recognize or treat (someone or something) as different.", example: "It's difficult to distinguish between the two twins." },
    { vocabulary: "Framework", wordType: "noun", ipa: "/ˈfreɪmwɜːk/", definition: "An essential supporting structure of an object or system.", example: "The legal framework for the project is still being finalized." },
    { vocabulary: "Interpret", wordType: "verb", ipa: "/ɪnˈtɜːprɪt/", definition: "Explain the meaning of (information, words, or actions).", example: "He was hired to interpret the data." },
    { vocabulary: "Motivating", wordType: "adj", ipa: "/ˈməʊtɪveɪtɪŋ/", definition: "Providing a reason or stimulus for doing something.", example: "He gave a very motivating speech." },
    { vocabulary: "Perspective", wordType: "noun", ipa: "/pəˈspektɪv/", definition: "A particular attitude toward or way of regarding something; a point of view.", example: "We need to look at this from a different perspective." },
    { vocabulary: "Significant", wordType: "adj", ipa: "/sɪɡˈnɪfɪkənt/", definition: "Sufficiently great or important to be worthy of attention.", example: "There has been a significant increase in sales this year." },
    { vocabulary: "Sustainable", wordType: "adj", ipa: "/səˈsteɪnəbl/", definition: "Able to be maintained at a certain rate or level.", example: "The company is committed to sustainable development." },
    { vocabulary: "Widespread", wordType: "adj", ipa: "/ˈwaɪdspred/", definition: "Found or distributed over a large area or number of people.", example: "The storm caused widespread damage." },
    { vocabulary: "Yield", wordType: "verb", ipa: "/jiːld/", definition: "Produce or provide (a natural, agricultural, or industrial product).", example: "The investment is expected to yield high returns." },
    { vocabulary: "Abandoned", wordType: "adj", ipa: "/əbit/", definition: "Having been deserted or left.", example: "The police found the abandoned car in a field." },
    { vocabulary: "Absolute", wordType: "adj", ipa: "/ˈæbsəluːt/", definition: "Not qualified or diminished in any way; total.", example: "He has absolute confidence in his ability." },
    { vocabulary: "Absorb", wordType: "verb", ipa: "/əbˈzɔːrb/", definition: "Take in or soak up (energy or a liquid or other substance).", example: "Plants absorb carbon dioxide from the air." },
    { vocabulary: "Abstract", wordType: "adj", ipa: "/ˈæbstrækt/", definition: "Existing in thought or as an idea but not having a physical or concrete existence.", example: "Beauty is an abstract concept." },
    { vocabulary: "Academic", wordType: "adj", ipa: "/ˌækəˈdemɪk/", definition: "Relating to education and scholarship.", example: "The school has a strong academic reputation." },
    { vocabulary: "Accelerate", wordType: "verb", ipa: "/əkˈseləreɪt/", definition: "(of a vehicle) begin to move more quickly.", example: "The car can accelerate from 0 to 60 mph in six seconds." },
    { vocabulary: "Acceptance", wordType: "noun", ipa: "/əkˈseptəns/", definition: "The action of consenting to receive or undertake something offered.", example: "Her acceptance of the proposal was a surprise to everyone." },
    { vocabulary: "Access", wordType: "noun", ipa: "/ˈækses/", definition: "The means or opportunity to approach or enter a place.", example: "The building has wheelchair access." },
    { vocabulary: "Accompanied", wordType: "verb", ipa: "/əˈkʌmpənid/", definition: "Go somewhere with (someone) as a companion or escort.", example: "The child was accompanied by his mother." },
    { vocabulary: "Accomplish", wordType: "verb", ipa: "/əˈkʌmplɪʃ/", definition: "Achieve or complete successfully.", example: "We have accomplished a lot today." },
    { vocabulary: "Accordance", wordType: "noun", ipa: "/əˈkɔːrdns/", definition: "In a manner conforming with.", example: "The work was carried out in accordance with his instructions." },
    { vocabulary: "Accountant", wordType: "noun", ipa: "/əˈkaʊntənt/", definition: "A person whose job is to keep or inspect financial accounts.", example: "She works as an accountant for a large firm." },
    { vocabulary: "Accumulate", wordType: "verb", ipa: "/əˈkjuːmjəleɪt/", definition: "Gather together or acquire an increasing quantity of.", example: "He managed to accumulate a large amount of wealth." },
    { vocabulary: "Accurate", wordType: "adj", ipa: "/ˈækjərət/", definition: "Correct in all details; exact.", example: "The report provided an accurate description." },
    { vocabulary: "Accusation", wordType: "noun", ipa: "/ˌækjuˈzeɪʃn/", definition: "A charge or claim that someone has done something wrong.", example: "He denied the accusation of theft." },
    { vocabulary: "Accustomed", wordType: "adj", ipa: "/əˈkʌstəmd/", definition: "Customary; usual.", example: "I am not accustomed to such cold weather." },
    { vocabulary: "Achievement", wordType: "noun", ipa: "/əˈtʃiːvmənt/", definition: "A thing done successfully, typically by effort, courage, or skill.", example: "Winning the title was a remarkable achievement." },
    { vocabulary: "Acknowledge", wordType: "verb", ipa: "/əkˈnɒlɪdʒ/", definition: "Accept or admit the existence or truth of.", example: "I acknowledge that I made a mistake." },
    { vocabulary: "Acquire", wordType: "verb", ipa: "/əˈkwaɪər/", definition: "Buy or obtain (an object or asset) for oneself.", example: "The company has acquired several smaller firms." },
    { vocabulary: "Adaptation", wordType: "noun", ipa: "/ˌædæpˈteɪʃn/", definition: "The action or process of adapting or being adapted.", example: "The film is an adaptation of a famous novel." },
  ],
  "C1": [
    { vocabulary: "Ambiguous", wordType: "adj", ipa: "/æmˈbɪɡjuəs/", definition: "Open to more than one interpretation; having a double meaning.", example: "The contract's wording was ambiguous." },
    { vocabulary: "Comprehensive", wordType: "adj", ipa: "/ˌkɒmprɪˈhensɪv/", definition: "Complete; including all or nearly all elements or aspects of something.", example: "The report offers a comprehensive look at the issue." },
    { vocabulary: "Diligent", wordType: "adj", ipa: "/ˈdɪlɪdʒənt/", definition: "Having or showing care and conscientiousness in one's work or duties.", example: "She is a diligent worker who always finishes her tasks on time." },
    { vocabulary: "Eloquent", wordType: "adj", ipa: "/ˈeləkwənt/", definition: "Fluent or persuasive in speaking or writing.", example: "He gave an eloquent speech about human rights." },
    { vocabulary: "Inevitably", wordType: "adv", ipa: "/ɪnˈevɪtəbli/", definition: "As is certain to happen; unavoidably.", example: "Growing old inevitably brings changes." },
    { vocabulary: "Meticulous", wordType: "adj", ipa: "/məˈtɪkjələs/", definition: "Showing great attention to detail; very careful and precise.", example: "The researcher was meticulous in her documentation." },
    { vocabulary: "Prosperity", wordType: "noun", ipa: "/prɒˈsperəti/", definition: "The state of being prosperous (successful and wealthy).", example: "The country experienced a period of peace and prosperity." },
    { vocabulary: "Sustainable", wordType: "adj", ipa: "/səˈsteɪnəbl/", definition: "Able to be maintained at a certain rate or level.", example: "The government is promoting sustainable economic growth." },
    { vocabulary: "Acquainted", wordType: "adj", ipa: "/əˈkweɪntɪd/", definition: "Make someone aware of or familiar with.", example: "I am not acquainted with his early work." },
    { vocabulary: "Conspicuous", wordType: "adj", ipa: "/kənˈspɪkjuəs/", definition: "Standing out so as to be clearly visible.", example: "He was very conspicuous in his red tracksuit." },
    { vocabulary: "Deteriorate", wordType: "verb", ipa: "/dɪˈtɪəriəreɪt/", definition: "Become progressively worse.", example: "The weather conditions began to deteriorate rapidly." },
    { vocabulary: "Impeccable", wordType: "adj", ipa: "/ɪmˈpekəbl/", definition: "In accordance with the highest standards; faultless.", example: "Her table manners were impeccable." },
    { vocabulary: "Lucrative", wordType: "adj", ipa: "/ˈluːkrətɪv/", definition: "Producing a great deal of profit.", example: "He turned his hobby into a lucrative business." },
    { vocabulary: "Oblivious", wordType: "adj", ipa: "/əˈblɪviəs/", definition: "Not aware of or not concerned about what is happening around one.", example: "She was oblivious to the danger." },
    { vocabulary: "Prevalent", wordType: "adj", ipa: "/ˈprevələnt/", definition: "Widespread in a particular area or at a particular time.", example: "The disease is more prevalent in tropical climates." },
    { vocabulary: "Resilience", wordType: "noun", ipa: "/rɪˈzɪliəns/", definition: "The capacity to recover quickly from difficulties.", example: "The community showed great resilience after the flood." },
    { vocabulary: "Substantial", wordType: "adj", ipa: "/səbˈstænʃl/", definition: "Of considerable importance, size, or worth.", example: "A substantial amount of money was raised for charity." },
    { vocabulary: "Volatile", wordType: "adj", ipa: "/ˈvɒlətaɪl/", definition: "Liable to change rapidly and unexpectedly, especially for the worse.", example: "The political situation in the region remains volatile." },
    { vocabulary: "Abundant", wordType: "adj", ipa: "/əˈbʌndənt/", definition: "Existing or available in large quantities; plentiful.", example: "The country has abundant natural resources." },
    { vocabulary: "Accessible", wordType: "adj", ipa: "/əkˈsesəbl/", definition: "(of a place) able to be reached or entered.", example: "The island is only accessible by boat." },
    { vocabulary: "Accomplishment", wordType: "noun", ipa: "/əˈkʌmplɪʃmənt/", definition: "Something that has been achieved successfully.", example: "Winning the Nobel Prize was her greatest accomplishment." },
    { vocabulary: "Adaptability", wordType: "noun", ipa: "/əˌdæptəˈbɪləti/", definition: "The quality of being able to adjust to new conditions.", example: "Adaptability is a key skill in a changing world." },
    { vocabulary: "Advocacy", wordType: "noun", ipa: "/ˈædvəkəsi/", definition: "Public support for or recommendation of a particular cause or policy.", example: "Her advocacy for children's rights is well known." },
    { vocabulary: "Affirmation", wordType: "noun", ipa: "/ˌæfəˈmeɪʃn/", definition: "The action or process of affirming something.", example: "He nodded his head in affirmation." },
    { vocabulary: "Aggregate", wordType: "noun", ipa: "/ˈæɡrɪɡət/", definition: "A whole formed by combining several separate elements.", example: "The council was an aggregate of three local authorities." },
    { vocabulary: "Alleviate", wordType: "verb", ipa: "/əˈliːvieɪt/", definition: "Make (suffering, deficiency, or a problem) less severe.", example: "The new medicine will help alleviate the pain." },
    { vocabulary: "Ambiguity", wordType: "noun", ipa: "/ˌæmbɪˈɡjuːəti/", definition: "The quality of being open to more than one interpretation.", example: "The ambiguity of the message led to many misunderstandings." },
    { vocabulary: "Analytical", wordType: "adj", ipa: "/ˌænəˈlɪtɪkl/", definition: "Relating to or using analysis or logical reasoning.", example: "She has a very analytical mind." },
    { vocabulary: "Anecdote", wordType: "noun", ipa: "/ˈænɪkdəʊt/", definition: "A short amusing or interesting story.", example: "He told several amusing anecdotes about his time in the army." },
    { vocabulary: "Antagonism", wordType: "noun", ipa: "/ænˈtæɡənɪzəm/", definition: "Active hostility or opposition.", example: "There is constant antagonism between the two neighbors." },
    { vocabulary: "Anticipate", wordType: "verb", ipa: "/ænˈtɪsɪpeɪt/", definition: "Regard as probable; expect or predict.", example: "We anticipate that the project will be finished by next month." },
    { vocabulary: "Appalling", wordType: "adj", ipa: "/əˈpɔːlɪŋ/", definition: "Causing shock or dismay; horrific.", example: "The living conditions in the prison were appalling." },
    { vocabulary: "Appeasement", wordType: "noun", ipa: "/əˈpiːzmənt/", definition: "The action or process of appeasing.", example: "The policy of appeasement failed to prevent the war." },
    { vocabulary: "Arbitrary", wordType: "adj", ipa: "/ˈɑːrbɪtrəri/", definition: "Based on random choice or personal whim.", example: "The decision was completely arbitrary." },
    { vocabulary: "Archaic", wordType: "adj", ipa: "/ɑːrˈkeɪɪk/", definition: "Very old or old-fashioned.", example: "The prison system is based on archaic laws." },
    { vocabulary: "Articulate", wordType: "adj/verb", ipa: "/ɑːrˈtɪkjələt/", definition: "Ability to speak fluently and coherently.", example: "She is an articulate and intelligent woman." },
    { vocabulary: "Assertion", wordType: "noun", ipa: "/əˈsɜːrʃn/", definition: "A confident and forceful statement of belief.", example: "The book is full of questionable assertions." },
    { vocabulary: "Asymmetric", wordType: "adj", ipa: "/ˌeɪsɪˈmetrɪk/", definition: "Having parts which fail to correspond.", example: "The building has an asymmetric design." },
  ],
  "C2": [
    { vocabulary: "Aesthetic", wordType: "adj", ipa: "/esˈθetɪk/", definition: "Concerned with beauty or the appreciation of beauty.", example: "The pictures give great aesthetic pleasure." },
    { vocabulary: "Benevolent", wordType: "adj", ipa: "/bəˈnevələnt/", definition: "Well meaning and kindly.", example: "He was a benevolent old man, adored by all his neighbors." },
    { vocabulary: "Capricious", wordType: "adj", ipa: "/kəˈprɪʃəs/", definition: "Given to sudden and unaccountable changes of mood or behavior.", example: "A capricious and often brutal administration." },
    { vocabulary: "Ephemeral", wordType: "adj", ipa: "/ɪˈfemərəl/", definition: "Lasting for a very short time.", example: "Fashions are ephemeral." },
    { vocabulary: "Resilience", wordType: "noun", ipa: "/rɪˈzɪliəns/", definition: "The capacity to recover quickly from difficulties; toughness.", example: "The resilience of the economy has come as a surprise to some." },
    { vocabulary: "Ubiquitous", wordType: "adj", ipa: "/juːˈbɪkwɪtəs/", definition: "Present, appearing, or found everywhere.", example: "His puffy face was ubiquitous on television." },
    { vocabulary: "Acrimonious", wordType: "adj", ipa: "/ˌækrɪˈməʊniəs/", definition: "(typically of a speech or a debate) angry and bitter.", example: "The meeting ended in an acrimonious dispute." },
    { vocabulary: "Enigmatic", wordType: "adj", ipa: "/ˌenɪɡˈmætɪk/", definition: "Difficult to interpret or understand; mysterious.", example: "He gave an enigmatic smile." },
    { vocabulary: "Inscrutable", wordType: "adj", ipa: "/ɪnˈskruːtəbl/", definition: "Impossible to understand or interpret.", example: "Guy looked at him with an inscrutable expression." },
    { vocabulary: "Mellifluous", wordType: "adj", ipa: "/meˈlɪfluəs/", definition: "(of a voice or words) sweet or musical; pleasant to hear.", example: "She read out the names in a mellifluous voice." },
    { vocabulary: "Penchant", wordType: "noun", ipa: "/ˈpɒntfɒnt/", definition: "A strong or habitual liking for something or tendency to do something.", example: "He has a penchant for adopted shelter dogs." },
    { vocabulary: "Quintessential", wordType: "adj", ipa: "/ˌkwɪntɪˈsenʃl/", definition: "Representing the most perfect or typical example of a quality or class.", example: "He was the quintessential tough guy." },
    { vocabulary: "Serendipity", wordType: "noun", ipa: "/ˌserənˈdɪpəti/", definition: "The occurrence and development of events by chance in a happy or beneficial way.", example: "Nature has always provided us with serendipity." },
    { vocabulary: "Sycophant", wordType: "noun", ipa: "/ˈsɪkəfænt/", definition: "A person who acts obsequiously toward someone important in order to gain advantage.", example: "I thought you were just a sycophant." },
    { vocabulary: "Vociferous", wordType: "adj", ipa: "/vəˈsɪfərəs/", definition: "(especially of a person or speech) vehement or clamorous.", example: "He was a vociferous critic of the president." },
    { vocabulary: "Zealous", wordType: "adj", ipa: "/ˈzeləs/", definition: "Having or showing zeal.", example: "The council was extremely zealous in the application of the regulations." },
    { vocabulary: "Aberration", wordType: "noun", ipa: "/ˌæbəˈreɪʃn/", definition: "A departure from what is normal or expected.", example: "The recent drop in sales was a temporary aberration." },
    { vocabulary: "Abject", wordType: "adj", ipa: "/ˈæbdʒekt/", definition: "(of something bad) experienced or present to the maximum degree.", example: "They live in abject poverty." },
    { vocabulary: "Abridge", wordType: "verb", ipa: "/əˈbrɪdʒ/", definition: "Shorten (a book, movie, or speech) without losing the sense.", example: "The article was abridged for the magazine." },
    { vocabulary: "Abstruse", wordType: "adj", ipa: "/əbˈstruːs/", definition: "Difficult to understand; obscure.", example: "The professor's lecture was very abstruse." },
    { vocabulary: "Accolade", wordType: "noun", ipa: "/ˈækəleɪd/", definition: "An award or privilege granted as a special honor.", example: "The film received many accolades from critics." },
    { vocabulary: "Acquiesce", wordType: "verb", ipa: "/ˌækwiˈes/", definition: "Accept something reluctantly but without protest.", example: "She eventually acquiesced with his plan." },
    { vocabulary: "Adamant", wordType: "adj", ipa: "/ˈædəmənt/", definition: "Refusing to be persuaded or to change one's mind.", example: "He was adamant that he would not resign." },
    { vocabulary: "Adulation", wordType: "noun", ipa: "/ˌædjuˈleɪʃn/", definition: "Excessive admiration or praise.", example: "The singer was surrounded by the adulation of her fans." },
    { vocabulary: "Alacrity", wordType: "noun", ipa: "/əˈlækrəti/", definition: "Brisk and cheerful readiness.", example: "She accepted the invitation with alacrity." },
    { vocabulary: "Ambivalent", wordType: "adj", ipa: "/æmˈbɪvələnt/", definition: "Having mixed feelings or contradictory ideas.", example: "He has an ambivalent attitude toward fame." },
    { vocabulary: "Ameliorate", wordType: "verb", ipa: "/əˈmiːliəreɪt/", definition: "Make (something bad or unsatisfactory) better.", example: "Strategies to ameliorate the negative effects of the crisis." },
    { vocabulary: "Anachronism", wordType: "noun", ipa: "/əˈnækrənɪzəm/", definition: "Appropriate to a period other than that in which it exists.", example: "The old house is an anachronism in this modern neighborhood." },
    { vocabulary: "Anathema", wordType: "noun", ipa: "/əˈnæθəmə/", definition: "Something or someone that one vehemently dislikes.", example: "Modern art is anathema to him." },
    { vocabulary: "Antediluvian", wordType: "adj", ipa: "/ˌæntidɪˈluːviən/", definition: "Of or belonging to the time before the biblical Flood.", example: "His ideas about women are positively antediluvian." },
    { vocabulary: "Antithesis", wordType: "noun", ipa: "/ænˈtɪθəsɪs/", definition: "A person or thing that is the direct opposite.", example: "Love is the antithesis of selfishness." },
    { vocabulary: "Aphorism", wordType: "noun", ipa: "/ˈæfərɪzəm/", definition: "A pithy observation that contains a general truth.", example: "The aphorism 'haste makes waste'." },
    { vocabulary: "Apocryphal", wordType: "adj", ipa: "/əˈpɒkrɪfl/", definition: "(of a story) of doubtful authenticity.", example: "An apocryphal story about the city's founder." },
    { vocabulary: "Apostate", wordType: "noun", ipa: "/əˈpɒsteɪt/", definition: "A person who renounces a belief or principle.", example: "He was branded an apostate after leaving the party." },
    { vocabulary: "Approbation", wordType: "noun", ipa: "/ˌæprəˈbeɪʃn/", definition: "Approval or praise.", example: "The proposal met with widespread approbation." },
    { vocabulary: "Arcane", wordType: "adj", ipa: "/ɑːrˈkeɪn/", definition: "Understood by few; mysterious or secret.", example: "Arcane rituals associated with the ancient cult." },
  ],
};

export function CEFRVocabulary({
  words,
  setWords
}: {
  words: Word[];
  setWords: (words: Word[]) => void;
}) {
  const [activeLevel, setActiveLevel] = useState("A1");

  const getFriendlyType = (t: string) => {
    const norm = t.toLowerCase().trim();
    if (norm === "noun") return "(n)";
    if (norm === "verb") return "(v)";
    if (norm === "adj" || norm === "adjective") return "(adj)";
    if (norm === "adv" || norm === "adverb") return "(adv)";
    if (norm === "idiom") return "(idiom)";
    if (norm === "phrase") return "(phrase)";
    if (norm === "sentence") return "(sent)";
    return `(${norm})`;
  };

  const addWord = (w: CEFRWord) => {
    // Check if already in bank
    if (words.some(existing => existing.vocabulary.toLowerCase() === w.vocabulary.toLowerCase())) {
      return;
    }

    const newWord: Word = {
      id: `cefr-${Date.now()}-${w.vocabulary}`,
      vocabulary: w.vocabulary,
      wordType: w.wordType,
      ipa: w.ipa,
      definition: w.definition,
      examples: [w.example],
      tags: ["CEFR", activeLevel],
      difficulty: 0,
      lastReviewed: new Date().toISOString(),
      nextReview: new Date(Date.now() + 86400000).toISOString(),
    };

    setWords([newWord, ...words]);
  };

  const isWordInBank = (v: string) => words.some(w => w.vocabulary.toLowerCase() === v.toLowerCase());

  return (
    <div className="space-y-4">
      <div className="flex justify-center gap-2 flex-wrap mb-6">
        {Object.keys(CEFR_DATA).map(level => (
          <button
            key={level}
            onClick={() => setActiveLevel(level)}
            className={cn(
              "px-4 py-2 rounded-lg font-bold text-sm tracking-widest transition-all sketch-border",
              activeLevel === level 
                ? "bg-crimson text-white border-crimson shadow-md scale-105" 
                : "bg-white text-ink/60 border-ink/10 hover:border-ink/30"
            )}
          >
            {level}
          </button>
        ))}
      </div>

      <div className="bg-ink/5 p-4 rounded-xl sketch-border border-dashed mb-6 flex items-start gap-3">
        <Info className="text-crimson shrink-0 mt-1" size={18} />
        <div className="text-xs leading-relaxed text-ink/70">
          <p className="font-bold text-ink mb-1">Cấp độ {activeLevel}:</p>
          {activeLevel === "A1" && "Dành cho người mới bắt đầu. Tập trung vào các từ vựng cơ bản nhất để giao tiếp đơn giản."}
          {activeLevel === "A2" && "Tiền trung cấp. Các từ vựng mô tả gia đình, công việc, mua sắm và môi trường xung quanh."}
          {activeLevel === "B1" && "Trung cấp. Có khả năng hiểu các điểm chính của các chủ đề quen thuộc trong công việc, trường học."}
          {activeLevel === "B2" && "Hậu trung cấp. Có khả năng hiểu các ý chính của các văn bản phức tạp về các chủ đề cụ thể hoặc trừu tượng."}
          {activeLevel === "C1" && "Cao cấp. Có khả năng hiểu các văn bản dài và khó, nhận biết được các ý nghĩa tiềm ẩn."}
          {activeLevel === "C2" && "Thông thạo. Có khả năng hiểu một cách dễ dàng hầu hết mọi văn bản đọc hoặc nghe."}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CEFR_DATA[activeLevel].map((word) => (
          <div key={word.vocabulary} className="bg-white p-4 sketch-border shadow-sm group hover:shadow-md transition-all relative">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="text-xl font-bold text-ink">{word.vocabulary}</h4>
                <div className="flex gap-2 items-center text-[10px] uppercase font-bold text-ink/40 tracking-widest">
                  <span className="bg-ink/5 px-1.5 py-0.5 rounded italic">{getFriendlyType(word.wordType)}</span>
                  <span>{word.ipa}</span>
                </div>
              </div>
              <button
                onClick={() => addWord(word)}
                disabled={isWordInBank(word.vocabulary)}
                className={cn(
                  "p-2 rounded-full transition-all border-2",
                  isWordInBank(word.vocabulary)
                    ? "bg-green-50 text-green-600 border-green-200"
                    : "bg-ink/5 text-ink/40 hover:bg-ink hover:text-white border-transparent"
                )}
              >
                {isWordInBank(word.vocabulary) ? <Check size={16} /> : <Plus size={16} />}
              </button>
            </div>
            
            <p className="text-sm font-medium mb-3 leading-relaxed">{word.definition}</p>
            
            <div className="bg-paper/50 p-2 rounded border border-dashed border-ink/10">
              <p className="text-xs hand-text tracking-wide italic">"{word.example}"</p>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center py-10 opacity-40">
        <BookOpen className="mx-auto mb-2" size={32} />
        <p className="text-sm hand-text">Học tập trung theo cấp độ giúp bạn tiến bộ nhanh hơn.</p>
      </div>
    </div>
  );
}
