import React, { useState, useMemo } from 'react';
import {
  Brain,
  BookOpen,
  CheckCircle2,
  Circle,
  Search,
  Sparkles,
  ArrowRight,
  Filter,
  Layers,
  FileText,
  ChevronRight,
  X,
  Play,
  RotateCcw,
  Check,
  Star,
  Compass,
  Trophy,
  ExternalLink,
  Flame,
  Volume2,
  Keyboard
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { LEVEL_THEMES } from './StudyHub';

export interface KnowledgeTopic {
  id: string;
  code: string; // e.g. A1.1, A1.2
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
  category: 'Ngữ pháp' | 'Từ vựng' | 'Phát âm' | 'Kỹ năng';
  title: string;
  vietnameseTitle: string;
  summary: string;
  difficulty: 'Căn bản' | 'Sơ cấp' | 'Trung cấp' | 'Nâng cao' | 'Chuyên sâu';
  formulas: string[];
  examples: { en: string; vi: string }[];
  commonMistakes?: string;
  tips?: string;
  completed: boolean;
  mindmapOutline: string;
}

export const INITIAL_KNOWLEDGE_TOPICS: KnowledgeTopic[] = [
  // --- LEVEL A1: CĂN BẢN (MẤT GỐC) ---
  {
    id: 'a1-tobe',
    code: 'A1.1',
    level: 'A1',
    category: 'Ngữ pháp',
    title: 'Động từ To Be (am / is / are)',
    vietnameseTitle: 'Thì hiện tại của động từ To Be',
    summary: 'Nền tảng quan trọng nhất để giới thiệu bản thân, miêu tả đặc điểm, nghề nghiệp và vị trí.',
    difficulty: 'Căn bản',
    formulas: [
      '(+) Khẳng định: S + am / is / are + Noun / Adjective',
      '(-) Phủ định: S + am / is / are + not + Noun / Adjective',
      '(?) Nghi vấn: Am / Is / Are + S + Noun / Adjective?'
    ],
    examples: [
      { en: 'I am a passionate English learner.', vi: 'Tôi là một người học tiếng Anh đầy đam mê.' },
      { en: 'She is not afraid of speaking in public.', vi: 'Cô ấy không sợ nói chuyện trước đám đông.' },
      { en: 'Are they ready for the final exam?', vi: 'Họ đã sẵn sàng cho kỳ thi cuối kỳ chưa?' }
    ],
    commonMistakes: 'Không dùng dạng rút gọn trong câu trả lời ngắn khẳng định. Ví dụ: nói "Yes, I am" (đúng), KHÔNG nói "Yes, I\'m" (sai).',
    tips: 'Quy tắc ngón tay: I đi với am; He/She/It và danh từ số ít đi với is; You/We/They và danh từ số nhiều đi với are.',
    completed: true,
    mindmapOutline: `Động từ To Be (am / is / are)
  Khẳng định (+) // S + am/is/are + N/Adj
    I am (I'm a student)
    He / She / It is (She is kind)
    You / We / They are (They are ready)
  Phủ định (-) // S + am/is/are + not
    I am not // I'm not tired
    He / She / It is not // isn't
    You / We / They are not // aren't
  Nghi vấn (?) // Am/Is/Are + S + ...?
    Yes/No Question // Is she at home?
    Wh- Question // Where are you from?
  Lưu ý quan trọng // Không viết tắt câu trả lời ngắn Yes, I am`
  },
  {
    id: 'a1-pronouns',
    code: 'A1.2',
    level: 'A1',
    category: 'Ngữ pháp',
    title: 'Đại Từ Nhân Xưng & Tính Từ Sở Hữu',
    vietnameseTitle: 'Chủ ngữ, tân ngữ và tính từ sở hữu',
    summary: 'Cách dùng I/me/my, you/you/your, he/him/his để xưng hô và chỉ quyền sở hữu chính xác.',
    difficulty: 'Căn bản',
    formulas: [
      'Chủ ngữ (Subject): I, You, He, She, It, We, They',
      'Tân ngữ (Object): me, you, him, her, it, us, them (đứng sau động từ hoặc giới từ)',
      'Tính từ sở hữu: my, your, his, her, its, our, their + Danh từ'
    ],
    examples: [
      { en: 'This is my favorite notebook; she gave it to me.', vi: 'Đây là cuốn sổ tay yêu thích của tôi; cô ấy đã tặng nó cho tôi.' },
      { en: 'Their house is located near the central library.', vi: 'Ngôi nhà của họ nằm gần thư viện trung tâm.' }
    ],
    commonMistakes: 'Dễ nhầm "its" (tính từ sở hữu của nó) với "it\'s" (viết tắt của it is hoặc it has).',
    completed: true,
    mindmapOutline: `Đại Từ & Tính Từ Sở Hữu
  Đại từ làm chủ ngữ (Subject) // Đứng trước động từ
    I, You, We, They
    He, She, It
  Đại từ làm tân ngữ (Object) // Đứng sau động từ & giới từ
    me, you, us, them
    him, her, it
  Tính từ sở hữu (Possessive Adj) // Phải có danh từ đi sau
    my, your, our, their
    his, her, its (không có dấu phẩy)`
  },
  {
    id: 'a1-present-simple',
    code: 'A1.3',
    level: 'A1',
    category: 'Ngữ pháp',
    title: 'Thì Hiện Tại Đơn (Present Simple)',
    vietnameseTitle: 'Thói quen, lịch trình và chân lý hiển nhiên',
    summary: 'Thì cơ bản và được dùng nhiều nhất để nói về thói quen hàng ngày, sở thích và quy luật tự nhiên.',
    difficulty: 'Căn bản',
    formulas: [
      '(+) S + V(s/es) + O (He/She/It: động từ thêm s/es)',
      '(-) S + do / does + not + V(nguyên mẫu)',
      '(?) Do / Does + S + V(nguyên mẫu)?'
    ],
    examples: [
      { en: 'The sun rises in the east every morning.', vi: 'Mặt trời mọc ở hướng đông mỗi buổi sáng.' },
      { en: 'He does not drink coffee after 4 PM.', vi: 'Anh ấy không uống cà phê sau 4 giờ chiều.' }
    ],
    commonMistakes: 'Quên thêm "s/es" khi chủ ngữ là ngôi thứ 3 số ít (He, She, It, danh từ số ít).',
    tips: 'Dấu hiệu nhận biết: always, usually, often, sometimes, rarely, never, every day.',
    completed: true,
    mindmapOutline: `Thì Hiện Tại Đơn (Present Simple)
  Cách dùng chính // Thói quen, chân lý, lịch trình
    Thói quen hàng ngày (I read every morning)
    Chân lý khoa học (Water boils at 100°C)
    Lịch tàu xe, sự kiện cố định
  Công thức khẳng định (+) // S + V / V(s/es)
    I/You/We/They + V nguyên mẫu
    He/She/It + V(s/es) (watches, goes, fixes)
  Công thức phủ định & nghi vấn // Mượn trợ động từ do/does
    (-) S + do/does not + V bare
    (?) Do/Does + S + V bare?
  Trạng từ tần suất // always, usually, often, every day`
  },
  {
    id: 'a1-ipa-44',
    code: 'A1.4',
    level: 'A1',
    category: 'Phát âm',
    title: 'Bảng Phiên Âm IPA Chuẩn Quốc Tế (44 Âm)',
    vietnameseTitle: 'Hệ thống 44 âm IPA (Nguyên âm & Phụ âm)',
    summary: 'Chìa khóa giúp bạn đọc đúng mọi từ vựng trong từ điển mà không cần nghe mẫu.',
    difficulty: 'Căn bản',
    formulas: [
      '12 Nguyên âm đơn (Monophthongs): /iː/, /ɪ/, /uː/, /ʊ/, /e/, /ə/, /ɜː/, /ɔː/, /æ/, /ʌ/, /ɑː/, /ɒ/',
      '8 Nguyên âm đôi (Diphthongs): /eɪ/, /aɪ/, /ɔɪ/, /aʊ/, /əʊ/, /ɪə/, /eə/, /ʊə/',
      '24 Phụ âm (Consonants): 8 cặp vô thanh - hữu thanh + 8 âm còn lại'
    ],
    examples: [
      { en: '/iː/ (sheep) vs /ɪ/ (ship)', vi: 'Cặp âm i dài (cười nhẹ) và i ngắn (dứt khoát).' },
      { en: '/θ/ (think) vs /ð/ (this)', vi: 'Âm kẹp lưỡi vô thanh và hữu thanh.' }
    ],
    commonMistakes: 'Bỏ quên phụ âm cuối (ending sounds) như /s/, /t/, /d/, /k/, /z/.',
    tips: 'Luyện theo cặp tương phản: âm dài có dấu hai chấm [:], âm ngắn đọc dứt khoát.',
    completed: true,
    mindmapOutline: `Bảng Phiên Âm IPA (44 Âm)
  12 Nguyên âm đơn (Monophthongs)
    Nguyên âm dài (có dấu :) // /iː/, /uː/, /ɜː/, /ɔː/, /ɑː/
    Nguyên âm ngắn // /ɪ/, /ʊ/, /e/, /ə/, /æ/, /ʌ/, /ɒ/
  8 Nguyên âm đôi (Diphthongs) // Trượt từ âm này sang âm khác
    Đuôi /ɪ/ // /eɪ/ (say), /aɪ/ (my), /ɔɪ/ (boy)
    Đuôi /ʊ/ // /aʊ/ (now), /əʊ/ (go)
    Đuôi /ə/ // /ɪə/ (here), /eə/ (hair), /ʊə/ (tour)
  24 Phụ âm (Consonants)
    Cặp vô thanh (không rung cổ) // /p/, /t/, /k/, /f/, /θ/, /s/, /ʃ/, /tʃ/
    Cặp hữu thanh (rung cổ) // /b/, /d/, /g/, /v/, /ð/, /z/, /ʒ/, /dʒ/`
  },
  {
    id: 'a1-vocab-core',
    code: 'A1.5',
    level: 'A1',
    category: 'Từ vựng',
    title: '1.000 Từ Vựng Cốt Lõi Đời Sống Hàng Ngày',
    vietnameseTitle: 'Từ vựng giao tiếp căn bản Oxford 1000',
    summary: 'Chiếm 70% nội dung hội thoại thường nhật: gia đình, nhà cửa, thời gian, công việc, ẩm thực.',
    difficulty: 'Căn bản',
    formulas: [
      'Phương pháp Spaced Repetition (Lặp lại ngắt quãng)',
      'Học theo cụm từ (Collocations) thay vì học từ đơn lẻ'
    ],
    examples: [
      { en: 'Make a decision (Không dùng "do a decision")', vi: 'Đưa ra một quyết định' },
      { en: 'Have breakfast / Take a shower / Catch the bus', vi: 'Ăn sáng / Tắm / Bắt xe buýt' }
    ],
    tips: 'Mỗi từ học kèm 1 câu ví dụ thực tế liên quan đến cuộc sống của bạn.',
    completed: false,
    mindmapOutline: `1.000 Từ Vựng Cốt Lõi (A1)
  Sinh hoạt hàng ngày // Daily Routine
    Buổi sáng // wake up, brush teeth, make coffee
    Di chuyển // walk, drive, take bus, arrive
    Công việc & Học tập // start work, meeting, study
  Gia đình & Mối quan hệ // Family & Friends
    Thành viên // parents, sibling, spouse, colleague
    Tính cách // friendly, patient, honest, polite
  Ăn uống & Mua sắm // Food & Shopping
    Thực phẩm // vegetables, meat, bread, fruits
    Mua sắm // price, discount, payment, receipt`
  },

  // --- LEVEL A2: SƠ CẤP (GIAO TIẾP HÀNG NGÀY) ---
  {
    id: 'a2-past-simple',
    code: 'A2.1',
    level: 'A2',
    category: 'Ngữ pháp',
    title: 'Thì Quá Khứ Đơn (Past Simple)',
    vietnameseTitle: 'Kể lại sự việc đã kết thúc trong quá khứ',
    summary: 'Cách dùng động từ có quy tắc (-ed) và 360 động từ bất quy tắc để kể chuyện quá khứ.',
    difficulty: 'Sơ cấp',
    formulas: [
      '(+) S + V2 / V-ed + O',
      '(-) S + did not (didn\'t) + V(nguyên mẫu)',
      '(?) Did + S + V(nguyên mẫu)?'
    ],
    examples: [
      { en: 'We spent our vacation in Da Nang last summer.', vi: 'Chúng tôi đã nghỉ mát ở Đà Nẵng vào mùa hè năm ngoái.' },
      { en: 'She did not come to the party yesterday.', vi: 'Cô ấy đã không đến bữa tiệc ngày hôm qua.' }
    ],
    commonMistakes: 'Sau trợ động từ "did / didn\'t", động từ chính phải trở về dạng nguyên mẫu!',
    tips: 'Quy tắc phát âm -ed: /id/ sau t, d; /t/ sau âm vô thanh (ch, sh, p, k, f, s); /d/ các âm còn lại.',
    completed: true,
    mindmapOutline: `Thì Quá Khứ Đơn (Past Simple)
  Cách dùng // Hành động đã kết thúc trọn vẹn trong quá khứ
    Có mốc thời gian rõ ràng (yesterday, last week, in 2020)
    Chuỗi hành động liên tiếp trong quá khứ
  Động từ có quy tắc (Regular) // Thêm -ed
    Phát âm /id/ // sau t, d (wanted, decided)
    Phát âm /t/ // sau âm vô thanh (watched, stopped)
    Phát âm /d/ // sau âm hữu thanh (played, cleaned)
  Động từ bất quy tắc (Irregular) // Cột 2 bảng BQT
    go -> went, see -> saw, buy -> bought, have -> had
  Phủ định & Nghi vấn // Mượn trợ động từ DID
    (-) S + didn't + V nguyên mẫu
    (?) Did + S + V nguyên mẫu?`
  },
  {
    id: 'a2-prepositions',
    code: 'A2.2',
    level: 'A2',
    category: 'Ngữ pháp',
    title: 'Giới Từ Thời Gian & Nơi Chốn: In / On / At',
    vietnameseTitle: 'Quy tắc hình tam giác đảo ngược',
    summary: 'Cách sử dụng In, On, At chính xác tuyệt đối mà không cần học vẹt.',
    difficulty: 'Sơ cấp',
    formulas: [
      'IN (Lớn nhất / Chung nhất): Thế kỷ, năm, tháng, mùa, quốc gia, thành phố',
      'ON (Vừa phải / Cụ thể hơn): Ngày trong tuần, ngày tháng, tên đường phố',
      'AT (Nhỏ nhất / Chính xác nhất): Giờ giấc cụ thể, địa chỉ nhà số nhà'
    ],
    examples: [
      { en: 'The conference starts at 8:30 AM, on Monday, in July.', vi: 'Hội nghị bắt đầu lúc 8:30 sáng, vào thứ Hai, trong tháng Bảy.' },
      { en: 'She lives at 123 Main Street, on Oxford Street, in London.', vi: 'Cô ấy sống tại số 123 phố Main, trên đường Oxford, ở Luân Đôn.' }
    ],
    completed: false,
    mindmapOutline: `Giới Từ In / On / At (Tam Giác Đảo Ngược)
  Thời Gian (Time)
    IN (Khoảng rộng) // in 2025, in summer, in May, in the morning
    ON (Ngày cụ thể) // on Monday, on July 4th, on my birthday
    AT (Giờ chính xác) // at 7:00 PM, at noon, at midnight
  Nơi Chốn (Place)
    IN (Không gian lớn / bên trong) // in Vietnam, in Hanoi, in the room
    ON (Trên bề mặt / tên đường) // on the table, on Tran Phu street
    AT (Điểm cụ thể / địa chỉ) // at home, at the bus stop, at 10 Pasteur`
  },
  {
    id: 'a2-comparisons',
    code: 'A2.3',
    level: 'A2',
    category: 'Ngữ pháp',
    title: 'So Sánh Hơn & So Sánh Nhất (Comparatives & Superlatives)',
    vietnameseTitle: 'Tính từ ngắn và tính từ dài trong câu so sánh',
    summary: 'Diễn đạt sự khác biệt giữa hai hoặc nhiều đối tượng một cách sinh động.',
    difficulty: 'Sơ cấp',
    formulas: [
      'Tính từ ngắn (+er): S1 + be + adj-er + than + S2',
      'Tính từ dài (more): S1 + be + more + adj + than + S2',
      'So sánh nhất: S + be + the + adj-est / the most + adj'
    ],
    examples: [
      { en: 'Health is definitely more valuable than wealth.', vi: 'Sức khỏe chắc chắn quý giá hơn tiền tài.' },
      { en: 'This is the most memorable journey of my life.', vi: 'Đây là chuyến hành trình đáng nhớ nhất trong cuộc đời tôi.' }
    ],
    tips: 'Tính từ 2 âm tiết tận cùng bằng -y (happy, lucky) được tính là tính từ ngắn: happier, happiest.',
    completed: false,
    mindmapOutline: `So Sánh Hơn & So Sánh Nhất
  Tính từ ngắn (1 âm tiết & tận cùng -y)
    So sánh hơn // adj + er + than (faster, cleaner, happier)
    So sánh nhất // the + adj + est (the fastest, the cleanest)
  Tính từ dài (2 âm tiết trở lên)
    So sánh hơn // more + adj + than (more expensive, more efficient)
    So sánh nhất // the most + adj (the most beautiful)
  Bất quy tắc cần thuộc lòng
    good -> better -> the best
    bad -> worse -> the worst
    far -> farther/further -> the furthest`
  },
  {
    id: 'a2-stress',
    code: 'A2.4',
    level: 'A2',
    category: 'Phát âm',
    title: 'Quy Tắc Đánh Trọng Âm Từ (Word Stress Rules)',
    vietnameseTitle: 'Nhấn trọng âm từ 2 và 3 âm tiết',
    summary: 'Nói tiếng Anh tự nhiên như người bản xứ nhờ biết cách nhấn đúng trọng âm.',
    difficulty: 'Sơ cấp',
    formulas: [
      'Danh từ & Tính từ 2 âm tiết: thường nhấn âm 1 (PRE-sent, HAP-py)',
      'Động từ 2 âm tiết: thường nhấn âm 2 (pre-SENT, de-CIDE)',
      'Hậu tố hút trọng âm: -tion, -sion, -ic, -ical (nhấn âm liền trước nó)'
    ],
    examples: [
      { en: '\'record (danh từ: bản ghi) vs re\'cord (động từ: ghi âm)', vi: 'Cùng một từ nhưng khác loại từ sẽ đổi vị trí trọng âm.' },
      { en: 'infor\'mation, eco\'nomic', vi: 'Trọng âm rơi vào âm tiết đứng ngay trước hậu tố -tion và -ic.' }
    ],
    completed: true,
    mindmapOutline: `Quy Tắc Trọng Âm Từ (Word Stress)
  Từ có 2 âm tiết
    Danh từ & Tính từ -> Nhấn âm 1 // 'table, 'window, 'clever
    Động từ -> Nhấn âm 2 // re'ceive, de'cide, for'get
    Từ đổi loại từ // 'present (món quà) vs pre'sent (thuyết trình)
  Hậu tố nhận biết trọng âm
    Nhấn ngay trước hậu tố // -tion, -sion, -ic (so'lution, mu'sician)
    Nhấn cách 1 âm tiết // -cy, -ty, -phy, -gy (de'mocracy, tech'nology)`
  },

  // --- LEVEL B1: TRUNG CẤP (TỰ TIN & DIỄN ĐẠT QUAN ĐIỂM) ---
  {
    id: 'b1-present-perfect',
    code: 'B1.1',
    level: 'B1',
    category: 'Ngữ pháp',
    title: 'Thì Hiện Tại Hoàn Thành (Present Perfect)',
    vietnameseTitle: 'Cầu nối giữa quá khứ và hiện tại',
    summary: 'Diễn tả trải nghiệm sống, sự việc xảy ra ở quá khứ nhưng kết quả vẫn còn ảnh hưởng đến hiện tại.',
    difficulty: 'Trung cấp',
    formulas: [
      '(+) S + have / has + V3 / V-ed',
      '(-) S + have / has + not + V3 / V-ed',
      '(?) Have / Has + S + V3 / V-ed?'
    ],
    examples: [
      { en: 'I have studied English for three consecutive years.', vi: 'Tôi đã học tiếng Anh liên tục trong ba năm.' },
      { en: 'Have you ever traveled to Europe before?', vi: 'Bạn đã từng đi du lịch châu Âu trước đây chưa?' }
    ],
    commonMistakes: 'Dùng mốc thời gian quá khứ cụ thể (như "yesterday") với hiện tại hoàn thành là SAI. (Phải dùng Quá khứ đơn).',
    tips: 'Dấu hiệu nhận biết: since (mốc thời gian), for (khoảng thời gian), already, yet, ever, never, just, recently.',
    completed: false,
    mindmapOutline: `Thì Hiện Tại Hoàn Thành (Present Perfect)
  Cách dùng đặc trưng // Cầu nối Quá khứ -> Hiện tại
    Trải nghiệm bản thân (I have visited Paris twice)
    Bắt đầu quá khứ, kéo dài đến nay (lived here for 10 years)
    Vừa mới xảy ra (has just finished homework)
    Hành động quá khứ có kết quả ở hiện tại (lost my key)
  Công thức // S + have/has + V3/ed
    I / You / We / They + have + V3/ed
    He / She / It + has + V3/ed
  Từ nhận biết cốt lõi
    Since + mốc thời gian // since 2018, since last week
    For + khoảng thời gian // for 3 hours, for 5 months
    Already (đã rồi), Yet (chưa), Ever (từng), Never (chưa bao giờ)`
  },
  {
    id: 'b1-conditionals',
    code: 'B1.2',
    level: 'B1',
    category: 'Ngữ pháp',
    title: 'Câu Điều Kiện Loại 1 & Loại 2 (Conditionals)',
    vietnameseTitle: 'Điều kiện có thật ở hiện tại và giả định trái ngược',
    summary: 'Cấu trúc thiết yếu để lập luận, đưa ra lời khuyên, giả định tình huống thực tế.',
    difficulty: 'Trung cấp',
    formulas: [
      'Loại 1 (Có thật ở hiện tại/tương lai): If + S + V(hiện tại đơn), S + will / can + V(bare)',
      'Loại 2 (Giả định trái với hiện tại): If + S + V2/ed (To be dùng were), S + would / could + V(bare)'
    ],
    examples: [
      { en: 'If you practice speaking daily, your fluency will improve rapidly.', vi: 'Nếu bạn luyện nói hàng ngày, độ trôi chảy sẽ tiến bộ nhanh chóng.' },
      { en: 'If I had enough time, I would learn another language.', vi: 'Nếu tôi có đủ thời gian, tôi sẽ học thêm một ngôn ngữ nữa.' }
    ],
    tips: 'Trong câu điều kiện loại 2, mọi ngôi chủ ngữ đều có thể dùng "were" thay cho "was".',
    completed: true,
    mindmapOutline: `Câu Điều Kiện Loại 1 & 2
  Loại 1: Tình huống có thật ở hiện tại/tương lai
    Mệnh đề If // Hiện tại đơn: If + S + V(s/es)
    Mệnh đề chính // Tương lai đơn: S + will/can + V bare
    Ví dụ: If it rains tomorrow, we will stay home
  Loại 2: Giả định trái ngược với hiện tại
    Mệnh đề If // Quá khứ đơn (were cho mọi ngôi)
    Mệnh đề chính // S + would/could + V bare
    Ví dụ: If I were you, I would accept that offer`
  },
  {
    id: 'b1-relative-clauses',
    code: 'B1.3',
    level: 'B1',
    category: 'Ngữ pháp',
    title: 'Mệnh Đề Quan Hệ (Relative Clauses)',
    vietnameseTitle: 'Nối câu và bổ nghĩa bằng Who, Whom, Which, That, Whose',
    summary: 'Giúp câu văn mạch lạc, tránh lặp từ và nâng tầm khả năng diễn đạt chuyên nghiệp.',
    difficulty: 'Trung cấp',
    formulas: [
      'Who: thay thế cho danh từ chỉ người làm chủ ngữ',
      'Whom: thay thế cho danh từ chỉ người làm tân ngữ',
      'Which: thay thế cho danh từ chỉ vật/sự việc',
      'That: thay thế cho cả người và vật trong mệnh đề xác định',
      'Whose: chỉ quan hệ sở hữu (+ Danh từ)'
    ],
    examples: [
      { en: 'The mentor who inspired me to learn English is very dedicated.', vi: 'Người thầy đã truyền cảm hứng học tiếng Anh cho tôi rất tận tâm.' },
      { en: 'This is the application which provides automated radial mindmaps.', vi: 'Đây là ứng dụng cung cấp sơ đồ tư duy tỏa tròn tự động.' }
    ],
    completed: false,
    mindmapOutline: `Mệnh Đề Quan Hệ (Relative Clauses)
  Đại từ quan hệ
    Who // Người làm chủ ngữ (The girl who called me)
    Whom // Người làm tân ngữ (The man whom I met)
    Which // Vật làm chủ ngữ/tân ngữ (The book which is on desk)
    That // Thay thế who/which trong mệnh đề xác định
    Whose // Chỉ sự sở hữu (The boy whose dog ran away)
  Phân biệt 2 loại mệnh đề
    Mệnh đề xác định // Cần thiết, không có dấu phẩy, dùng được that
    Mệnh đề không xác định // Thêm thông tin, CÓ dấu phẩy, KHÔNG dùng that`
  },
  {
    id: 'b1-passive-voice',
    code: 'B1.4',
    level: 'B1',
    category: 'Ngữ pháp',
    title: 'Câu Bị Động (Passive Voice)',
    vietnameseTitle: 'Nhấn mạnh vào hành động và đối tượng chịu tác động',
    summary: 'Rất phổ biến trong văn phong học thuật, tin tức, tài liệu kỹ thuật và môi trường công sở.',
    difficulty: 'Trung cấp',
    formulas: [
      'Chủ động: S + V + O',
      'Bị động: S (từ O) + BE (chia theo thì) + V3 / V-ed (+ by O)'
    ],
    examples: [
      { en: 'The historical bridge was reconstructed in 2015.', vi: 'Cây cầu lịch sử đã được tái thiết vào năm 2015.' },
      { en: 'Millions of messages are processed by AI models every second.', vi: 'Hàng triệu thông điệp được các mô hình AI xử lý mỗi giây.' }
    ],
    completed: false,
    mindmapOutline: `Câu Bị Động (Passive Voice)
  Nguyên tắc chuyển đổi // S + Be + V3/ed + (by Agent)
    Tân ngữ chủ động -> biến thành Chủ ngữ bị động
    Động từ To Be chia đúng theo thì của câu gốc
    Động từ chính đưa về Quá khứ phân từ (V3/ed)
  Bị động các thì thông dụng
    Hiện tại đơn // S + am/is/are + V3/ed
    Quá khứ đơn // S + was/were + V3/ed
    Hiện tại hoàn thành // S + have/has been + V3/ed
    Động từ khuyết thiếu (Modal) // S + can/must/should be + V3/ed`
  },
  {
    id: 'b1-phrasal-verbs',
    code: 'B1.5',
    level: 'B1',
    category: 'Từ vựng',
    title: '200 Cụm Động Từ Thông Dụng (Phrasal Verbs)',
    vietnameseTitle: 'Cụm động từ tự nhiên trong giao tiếp',
    summary: 'Bí quyết giúp bài nói và viết tự nhiên như người bản ngữ, không bị cứng nhắc.',
    difficulty: 'Trung cấp',
    formulas: [
      'Cấu trúc: Verb + Preposition / Adverb tạo ra tầng nghĩa hoàn toàn mới'
    ],
    examples: [
      { en: 'Never give up on your dreams even when difficulties arise.', vi: 'Đừng bao giờ từ bỏ ước mơ của bạn ngay cả khi khó khăn ập đến.' },
      { en: 'I really look forward to meeting you again soon.', vi: 'Tôi rất mong đợi được gặp lại bạn sớm.' }
    ],
    tips: 'Học phrasal verbs theo nhóm tiểu từ: "up" (hoàn thành, tăng lên), "out" (biến mất, phân phát), "down" (giảm bớt).',
    completed: false,
    mindmapOutline: `200 Cụm Động Từ Thông Dụng (Phrasal Verbs)
  Nhóm với "UP" // Ý nghĩa hoàn thành, tăng lên, kết thúc
    Give up // Từ bỏ
    Look up // Tra cứu thông tin
    Pick up // Đón ai đó, nhặt lên
    Turn up // Xuất hiện, tăng âm lượng
  Nhóm với "OUT" // Ý nghĩa ra ngoài, cạn kiệt, phân phát
    Figure out // Tìm ra lời giải, thấu hiểu
    Run out of // Hết sạch (tiền, xăng, thời gian)
    Point out // Chỉ ra điều gì đó
  Nhóm giao tiếp công sở // Workplace Phrasal Verbs
    Carry out // Thực hiện (dự án, nghiên cứu)
    Call off // Hủy bỏ cuộc họp
    Put off // Trì hoãn việc gì lại`
  },

  // --- LEVEL B2: NÂNG CAO (HỌC THUẬT & GIAO TIẾP SÂU) ---
  {
    id: 'b2-mixed-conditionals',
    code: 'B2.1',
    level: 'B2',
    category: 'Ngữ pháp',
    title: 'Câu Điều Kiện Loại 3 & Hỗn Hợp (Mixed Conditionals)',
    vietnameseTitle: 'Giả định tiếc nuối trong quá khứ và ảnh hưởng đến hiện tại',
    summary: 'Cấu trúc ngữ pháp cao cấp thể hiện tư duy phản biện sắc bén và logic thời gian nhiều tầng.',
    difficulty: 'Nâng cao',
    formulas: [
      'Loại 3: If + S + had + V3/ed, S + would have + V3/ed',
      'Hỗn hợp: If + S + had + V3/ed (quá khứ), S + would + V(bare) (bây giờ)'
    ],
    examples: [
      { en: 'If I had invested in Bitcoin earlier, I would be financially independent now.', vi: 'Nếu tôi đầu tư vào Bitcoin sớm hơn, bây giờ tôi đã tự do tài chính rồi.' },
      { en: 'Had we listened to the forecast, we would have avoided the typhoon.', vi: 'Nếu chúng tôi lắng nghe dự báo, chúng tôi đã tránh được cơn bão.' }
    ],
    completed: false,
    mindmapOutline: `Câu Điều Kiện Loại 3 & Hỗn Hợp
  Điều kiện Loại 3 // Tiếc nuối sự việc đã xảy ra trong quá khứ
    Mệnh đề If // Quá khứ hoàn thành: If + had + V3/ed
    Mệnh đề chính // S + would/could have + V3/ed
    Ví dụ: If I had studied harder, I would have passed the exam
  Điều kiện Hỗn hợp (Mixed) // Quá khứ ảnh hưởng đến HIỆN TẠI
    If + had + V3/ed (hành động quá khứ)
    S + would + V bare (kết quả ở HIỆN TẠI)
  Đảo ngữ điều kiện loại 3 // Bỏ If
    Had + S + V3/ed, S + would have + V3/ed`
  },
  {
    id: 'b2-inversion',
    code: 'B2.2',
    level: 'B2',
    category: 'Ngữ pháp',
    title: 'Đảo Ngữ & Cấu Trúc Nhấn Mạnh (Inversion)',
    vietnameseTitle: 'Đảo trợ động từ lên trước chủ ngữ để tạo điểm nhấn',
    summary: 'Kỹ thuật viết học thuật đạt điểm cao trong IELTS Writing và diễn thuyết truyền cảm hứng.',
    difficulty: 'Nâng cao',
    formulas: [
      'Trạng từ phủ định đứng đầu: Never / Rarely / Seldom + Trợ động từ + S + V',
      'Not only... but also: Not only + Trợ động từ + S + V, but S also...',
      'Hardly... when / No sooner... than: Vừa mới... thì...'
    ],
    examples: [
      { en: 'Never have I witnessed such breathtaking scenery before.', vi: 'Chưa bao giờ tôi được chứng kiến cảnh tượng ngoạn mục đến vậy.' },
      { en: 'Hardly had the meeting started when the fire alarm rang.', vi: 'Cuộc họp vừa mới bắt đầu thì chuông báo cháy reo.' }
    ],
    completed: false,
    mindmapOutline: `Đảo Ngữ (Inversion)
  Đảo ngữ với trạng từ phủ định // Đưa trạng từ lên đầu câu
    Never, Rarely, Seldom, Little + Trợ động từ + S + V
    Ví dụ: Seldom do we see such extraordinary talent
  Cấu trúc "Vừa mới... thì..."
    Hardly / Scarcely + had + S + V3/ed + WHEN + S + V2/ed
    No sooner + had + S + V3/ed + THAN + S + V2/ed
  Cấu trúc "Không những... mà còn..."
    Not only + Trợ động từ + S + V..., BUT ALSO...
  Đảo ngữ câu điều kiện // Bỏ If
    Loại 1: Should + S + V bare
    Loại 2: Were + S + to V / Were + S
    Loại 3: Had + S + V3/ed`
  },
  {
    id: 'b2-collocations',
    code: 'B2.3',
    level: 'B2',
    category: 'Từ vựng',
    title: 'Collocations & Thành Ngữ Bản Xứ (Idiomatic Expressions)',
    vietnameseTitle: 'Cụm từ cố định tự nhiên như người bản xứ',
    summary: 'Vũ khí tối thượng giúp nâng Band điểm từ 6.0 lên 7.5+ trong mọi kỳ thi quốc tế.',
    difficulty: 'Nâng cao',
    formulas: [
      'Verb + Noun: bridge the gap, pose a threat, shed light on',
      'Adjective + Noun: pressing issue, golden opportunity, feasible solution'
    ],
    examples: [
      { en: 'We need innovative strategies to bridge the digital divide.', vi: 'Chúng ta cần những chiến lược đổi mới để thu hẹp khoảng cách số.' },
      { en: 'Learning a language is a journey, not a walk in the park.', vi: 'Học một ngôn ngữ là một hành trình, không phải là việc dễ dàng.' }
    ],
    completed: false,
    mindmapOutline: `Collocations & Thành Ngữ (Idioms)
  Collocations Học Thuật
    Verb + Noun // Conduct research, draw conclusions, pose a threat
    Adj + Noun // In-depth analysis, pivotal role, sustainable growth
    Adv + Adj // Heavily dependent, deeply concerned, highly effective
  Thành Ngữ Thông Dụng Bản Xứ
    Cost an arm and a leg // Cực kỳ đắt đỏ
    Once in a blue moon // Hiếm khi xảy ra
    Hit the nail on the head // Nói trúng tim đen / Nói rất chuẩn
    Take something with a grain of salt // Nghe để tham khảo, thận trọng`
  },

  // --- LEVEL C1: CHUYÊN NGHIỆP & THÀNH THẠO ---
  {
    id: 'c1-subjunctive',
    code: 'C1.1',
    level: 'C1',
    category: 'Ngữ pháp',
    title: 'Thể Giả Định & Cấu Trúc Khuyên Nhủ Khẩn Thiết',
    vietnameseTitle: 'Subjunctive Mood trong văn bản trang trọng',
    summary: 'Sử dụng động từ nguyên mẫu không chia sau các tính từ và động từ mang tính yêu cầu, khuyến nghị.',
    difficulty: 'Chuyên sâu',
    formulas: [
      'It is vital / essential / imperative that + S + (should) + V(bare)',
      'S + suggest / recommend / demand / insist that + S + V(bare)'
    ],
    examples: [
      { en: 'It is imperative that every team member be notified immediately.', vi: 'Điều cấp thiết là mọi thành viên trong nhóm phải được thông báo ngay lập tức.' },
      { en: 'The board recommended that he step down from his position.', vi: 'Hội đồng quản trị khuyến nghị anh ấy từ chức.' }
    ],
    completed: false,
    mindmapOutline: `Thể Giả Định (Subjunctive Mood)
  Cấu trúc với Tính Từ Khẩn Thiết // It is + Adj + that + S + V(bare)
    essential, vital, imperative, crucial, necessary
    Ví dụ: It is vital that he arrive on time (KHÔNG dùng arrives)
  Cấu trúc với Động Từ Đề Xuất // S + Verb + that + S + V(bare)
    demand, request, suggest, recommend, insist
    Dù chủ ngữ là he/she thì động từ vẫn nguyên mẫu không 's'
  Dạng bị động trong thể giả định // S + BE + V3/ed
    It is recommended that the report be submitted today`
  },
  {
    id: 'c1-academic-writing',
    code: 'C1.2',
    level: 'C1',
    category: 'Kỹ năng',
    title: 'Viết Luận Học Thuật & Tranh Luận Chuyên Nghiệp',
    vietnameseTitle: 'Kỹ thuật Hedging, Cohesion và Coherence đỉnh cao',
    summary: 'Cách dùng ngôn ngữ thận trọng (hedging), phát triển luận điểm chặt chẽ và thuyết phục.',
    difficulty: 'Chuyên sâu',
    formulas: [
      'Kỹ thuật Hedging: It is argued that... / Evidence suggests that... / This may potentially lead to...',
      'Từ nối lập luận: Notwithstanding, Conversely, Albeit, In light of the aforementioned facts'
    ],
    examples: [
      { en: 'Evidence suggests that consistent spaced recall can dramatically enhance long-term memory retention.', vi: 'Các bằng chứng cho thấy việc gợi nhớ ngắt quãng đều đặn có thể tăng cường đáng kể khả năng ghi nhớ dài hạn.' }
    ],
    completed: false,
    mindmapOutline: `Viết Luận Học Thuật & Tranh Luận (C1)
  Kỹ thuật Hedging (Ngôn ngữ thận trọng)
    Tránh khẳng định tuyệt đối (always, 100%)
    Dùng modal verbs // might, could, may tend to
    Cụm từ học thuật // It appears that, Current findings indicate
  Liên kết luận điểm (Coherence & Cohesion)
    Tương phản // Notwithstanding, Conversely, While on the surface
    Bổ sung & Nhấn mạnh // Furthermore, In particular, Crucially
    Kết luận logic // Consequently, It is therefore reasonable to deduce`
  }
];

interface AioKnowledgeBaseProps {
  onOpenMindmap: (topic: KnowledgeTopic) => void;
  onEditOutline: (topic: KnowledgeTopic) => void;
  onStudyFlashcard: (topic: KnowledgeTopic) => void;
  onSwitchToTypingTab?: () => void;
  completedTopicIds?: Set<string>;
  onToggleCompleteTopic?: (id: string) => void;
}

export function AioKnowledgeBase({
  onOpenMindmap,
  onEditOutline,
  onStudyFlashcard,
  onSwitchToTypingTab,
  completedTopicIds,
  onToggleCompleteTopic
}: AioKnowledgeBaseProps) {
  // Filters
  const [selectedLevel, setSelectedLevel] = useState<'ALL' | 'A1' | 'A2' | 'B1' | 'B2' | 'C1'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'Ngữ pháp' | 'Từ vựng' | 'Phát âm' | 'Kỹ năng'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'todo' | 'done'>('all');

  // Detail Modal State
  const [selectedTopicForDetail, setSelectedTopicForDetail] = useState<KnowledgeTopic | null>(null);

  // Local completed tracker fallback if not provided
  const [localCompleted, setLocalCompleted] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('glowup_knowledge_completed');
      if (saved) return new Set(JSON.parse(saved));
    } catch {}
    return new Set(INITIAL_KNOWLEDGE_TOPICS.filter((t) => t.completed).map((t) => t.id));
  });

  const isCompleted = (topicId: string) => {
    if (completedTopicIds) {
      return completedTopicIds.has(topicId);
    }
    return localCompleted.has(topicId);
  };

  const handleToggle = (topicId: string) => {
    if (onToggleCompleteTopic) {
      onToggleCompleteTopic(topicId);
      return;
    }
    setLocalCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(topicId)) next.delete(topicId);
      else next.add(topicId);
      try {
        localStorage.setItem('glowup_knowledge_completed', JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  };

  // Filtered Topics
  const filteredTopics = useMemo(() => {
    return INITIAL_KNOWLEDGE_TOPICS.filter((t) => {
      // Level
      if (selectedLevel !== 'ALL' && t.level !== selectedLevel) return false;
      // Category
      if (selectedCategory !== 'ALL' && t.category !== selectedCategory) return false;
      // Status
      const done = isCompleted(t.id);
      if (statusFilter === 'done' && !done) return false;
      if (statusFilter === 'todo' && done) return false;
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = t.title.toLowerCase().includes(q) || t.vietnameseTitle.toLowerCase().includes(q);
        const matchSummary = t.summary.toLowerCase().includes(q);
        const matchCode = t.code.toLowerCase().includes(q);
        if (!matchTitle && !matchSummary && !matchCode) return false;
      }
      return true;
    });
  }, [selectedLevel, selectedCategory, statusFilter, searchQuery, completedTopicIds, localCompleted]);

  // Overall Statistics
  const totalCount = INITIAL_KNOWLEDGE_TOPICS.length;
  const completedCount = INITIAL_KNOWLEDGE_TOPICS.filter((t) => isCompleted(t.id)).length;
  const completionPercentage = Math.round((completedCount / (totalCount || 1)) * 100);

  return (
    <div className="flex flex-col gap-5 w-full max-w-7xl mx-auto">
      {/* 1. HERO BANNER: AIO ENGLISH LỘ TRÌNH KIẾN THỨC */}
      <div className="bg-[#FFFDF7] p-5 sm:p-6 rounded-[24px] border-[2.5px] border-[#141414] shadow-[5px_5px_0px_#141414] flex flex-col md:flex-row items-center justify-between gap-5 relative overflow-hidden">
        {/* Decorative corner tag */}
        <div className="absolute top-0 right-0 bg-[#FEF08A] text-ink font-black text-[10px] uppercase px-4 py-1 border-b-2 border-l-2 border-[#141414] tracking-widest rounded-bl-xl shadow-xs">
          AIO English Standard • Kho Kiến Thức Toàn Diện
        </div>

        <div className="flex items-start gap-4 z-10">
          <div className="w-12 h-12 rounded-2xl bg-amber-400 border-2 border-[#141414] flex items-center justify-center shadow-[2px_2px_0px_#141414] shrink-0 mt-0.5">
            <BookOpen className="w-6 h-6 text-ink" />
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-2xl font-black text-ink uppercase tracking-tight">
                Kho Kiến Thức Cốt Lõi (A1 - C1)
              </h2>
              <span className="bg-emerald-100 text-emerald-800 border border-emerald-600 font-extrabold text-[11px] px-2 py-0.5 rounded-full">
                tab=kien-thuc
              </span>
            </div>
            <p className="text-xs sm:text-sm text-ink/75 font-medium max-w-2xl leading-relaxed">
              Toàn bộ bài học ngữ pháp, từ vựng, phát âm IPA và mẫu câu được hệ thống hóa chuẩn mực.
              Mỗi chủ điểm đều tích hợp <strong>Sơ đồ tư duy tỏa tròn (Sổ tay)</strong>, công thức, ví dụ và dàn ý có thể chỉnh sửa tự do.
            </p>
          </div>
        </div>

        {/* Progress Card */}
        <div className="bg-white p-4 rounded-2xl border-2 border-[#141414] shadow-[3px_3px_0px_#141414] w-full md:w-72 shrink-0 flex flex-col gap-2.5 z-10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-ink uppercase tracking-wider flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-500" /> Tiến độ kiến thức
            </span>
            <span className="text-sm font-black text-emerald-600">{completionPercentage}%</span>
          </div>

          <div className="w-full h-3 bg-gray-100 rounded-full border border-[#141414] overflow-hidden p-0.5">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-bold text-ink/70">
            <span>Đã nắm vững:</span>
            <span className="font-extrabold text-ink">
              {completedCount} / {totalCount} bài học
            </span>
          </div>

          {onSwitchToTypingTab && (
            <button
              onClick={onSwitchToTypingTab}
              className="mt-1 w-full py-1.5 px-3 bg-amber-300 hover:bg-amber-400 text-ink text-xs font-black uppercase rounded-xl border border-[#141414] shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              title="Luyện gõ câu tiếng Anh (aioenglish.com/go-cau)"
            >
              <Keyboard className="w-3.5 h-3.5 text-amber-950" />
              <span>Luyện Gõ Câu (tab=go-cau)</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. LEVEL TABS & CATEGORY FILTERS */}
      <div className="flex flex-col gap-3">
        {/* Level Tabs (All, A1, A2, B1, B2, C1) */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'ALL', label: 'Tất Cả Cấp Độ', desc: 'Toàn bộ bài học' },
            { id: 'A1', label: 'Level A1 (Căn Bản)', desc: 'Mất gốc & Cốt lõi', color: '#10B981' },
            { id: 'A2', label: 'Level A2 (Sơ Cấp)', desc: 'Giao tiếp hàng ngày', color: '#0EA5E9' },
            { id: 'B1', label: 'Level B1 (Trung Cấp)', desc: 'Tự tin diễn đạt', color: '#F59E0B' },
            { id: 'B2', label: 'Level B2 (Nâng Cao)', desc: 'Học thuật & Đọc báo', color: '#8B5CF6' },
            { id: 'C1', label: 'Level C1 (Chuyên Sâu)', desc: 'Thành thạo bản xứ', color: '#F43F5E' },
          ].map((lvl) => {
            const isActive = selectedLevel === lvl.id;
            return (
              <button
                key={lvl.id}
                onClick={() => setSelectedLevel(lvl.id as any)}
                className={cn(
                  'px-3.5 py-2 rounded-xl border-2 font-black text-xs transition-all flex flex-col items-start shrink-0 cursor-pointer text-left',
                  isActive
                    ? 'bg-[#141414] text-white border-[#141414] shadow-[3px_3px_0px_#141414] -translate-y-0.5'
                    : 'bg-white hover:bg-amber-50 text-ink/80 border-[#141414]/30 hover:border-[#141414]'
                )}
              >
                <span className="uppercase tracking-wider">{lvl.label}</span>
                <span className={cn('text-[10px] font-medium', isActive ? 'text-white/70' : 'text-ink/50')}>
                  {lvl.desc}
                </span>
              </button>
            );
          })}
        </div>

        {/* Category Pills & Search Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border-2 border-[#141414] shadow-[3px_3px_0px_#141414]">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-black text-ink/50 uppercase mr-1 hidden md:inline">
              Chủ điểm:
            </span>
            {(['ALL', 'Ngữ pháp', 'Từ vựng', 'Phát âm', 'Kỹ năng'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-black uppercase transition-all',
                  selectedCategory === cat
                    ? 'bg-amber-400 text-ink border border-[#141414] shadow-[1.5px_1.5px_0px_#141414]'
                    : 'bg-gray-100 text-ink/70 hover:bg-gray-200'
                )}
              >
                {cat === 'ALL' ? 'Tất Cả Loại' : cat}
              </button>
            ))}
          </div>

          {/* Search Bar & Mastery Filter */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Status Filter */}
            <div className="flex items-center bg-gray-100 p-0.5 rounded-xl border border-[#141414]/20 text-[11px] font-bold">
              <button
                onClick={() => setStatusFilter('all')}
                className={cn('px-2 py-0.5 rounded-lg', statusFilter === 'all' ? 'bg-[#141414] text-white' : 'text-ink/60')}
              >
                Tất cả
              </button>
              <button
                onClick={() => setStatusFilter('todo')}
                className={cn('px-2 py-0.5 rounded-lg', statusFilter === 'todo' ? 'bg-amber-400 text-ink' : 'text-ink/60')}
              >
                Chưa học
              </button>
              <button
                onClick={() => setStatusFilter('done')}
                className={cn('px-2 py-0.5 rounded-lg', statusFilter === 'done' ? 'bg-emerald-600 text-white' : 'text-ink/60')}
              >
                Đã thuộc
              </button>
            </div>

            {/* Search Input */}
            <div className="flex items-center bg-white border-2 border-[#141414] px-2.5 py-1 rounded-xl shadow-[1.5px_1.5px_0px_#141414] w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-ink/40 mr-1.5 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm chủ điểm, công thức..."
                className="bg-transparent outline-none w-full text-xs font-bold text-ink placeholder:text-ink/40"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-ink/40 hover:text-ink">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. KNOWLEDGE TOPICS LIST / CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTopics.map((topic) => {
          const done = isCompleted(topic.id);
          const theme = LEVEL_THEMES[topic.level] || LEVEL_THEMES.A1;

          return (
            <div
              key={topic.id}
              className={cn(
                'bg-white rounded-[20px] border-2 border-[#141414] p-4 flex flex-col justify-between gap-3.5 transition-all duration-200 group relative',
                done ? 'bg-[#F0FDF4]/90 border-emerald-700 shadow-[3px_3px_0px_#047857]' : 'shadow-[3.5px_3.5px_0px_#141414] hover:-translate-y-0.5'
              )}
            >
              {/* Top Row: Code Badge, Category, Mastery Checkbox */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  {/* CEFR Code Badge */}
                  <span
                    className="text-[11px] font-black px-2 py-0.5 rounded-lg border tracking-tight"
                    style={{
                      backgroundColor: theme.badgeBg,
                      color: theme.badgeText,
                      borderColor: theme.border
                    }}
                  >
                    {topic.code}
                  </span>

                  {/* Category Pill */}
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-black/5 text-ink/70">
                    {topic.category}
                  </span>
                </div>

                {/* Mastery Toggle */}
                <button
                  type="button"
                  onClick={() => handleToggle(topic.id)}
                  className={cn(
                    'flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-lg border transition-all cursor-pointer active:scale-95',
                    done
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-600'
                      : 'bg-white text-ink/60 border-ink/20 hover:border-ink hover:text-ink'
                  )}
                  title={done ? 'Đã nắm vững! Bấm để bỏ đánh dấu' : 'Chưa học. Bấm để đánh dấu đã thuộc bài'}
                >
                  {done ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                      <span>Đã nắm</span>
                    </>
                  ) : (
                    <>
                      <Circle className="w-3.5 h-3.5 text-ink/30" />
                      <span>Chưa học</span>
                    </>
                  )}
                </button>
              </div>

              {/* Title & Summary */}
              <div className="flex flex-col gap-1.5">
                <h3 className="text-sm font-black text-ink group-hover:text-amber-800 transition-colors line-clamp-1">
                  {topic.title}
                </h3>
                <p className="text-[11px] font-bold text-ink/50 italic line-clamp-1">
                  {topic.vietnameseTitle}
                </p>
                <p className="text-xs text-ink/75 font-medium line-clamp-2 leading-relaxed">
                  {topic.summary}
                </p>
              </div>

              {/* Key Formula Preview */}
              {topic.formulas && topic.formulas.length > 0 && (
                <div className="bg-[#FAF8F5] p-2 rounded-xl border border-ink/15 text-[11px] font-mono font-bold text-ink/80 truncate">
                  💡 {topic.formulas[0]}
                </div>
              )}

              {/* Action Buttons: Mindmap, Details, Outline, Flashcard */}
              <div className="flex items-center gap-1.5 pt-2 border-t border-dashed border-ink/15 flex-wrap">
                {/* 1. Open Mindmap in Canvas (Radial Sổ Tay) */}
                <button
                  type="button"
                  onClick={() => onOpenMindmap(topic)}
                  className="flex-1 py-1.5 px-2 bg-amber-300 hover:bg-amber-400 text-ink text-xs font-black rounded-xl border border-[#141414] shadow-[1.5px_1.5px_0px_#141414] flex items-center justify-center gap-1 transition-all active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                  title="Mở dạng Sơ Đồ Tỏa Tròn (Sổ Tay) theo mẫu"
                >
                  <Brain className="w-3.5 h-3.5" />
                  <span>Sơ Đồ Mindmap</span>
                </button>

                {/* 2. View Full Details */}
                <button
                  type="button"
                  onClick={() => setSelectedTopicForDetail(topic)}
                  className="py-1.5 px-2.5 bg-white hover:bg-gray-100 text-ink text-xs font-black rounded-xl border border-[#141414] shadow-[1.5px_1.5px_0px_#141414] flex items-center justify-center gap-1 transition-all active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                  title="Xem lý thuyết, công thức & ví dụ chi tiết"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Chi Tiết</span>
                </button>

                {/* 3. Edit Outline (Soạn bài / Dàn ý) */}
                <button
                  type="button"
                  onClick={() => onEditOutline(topic)}
                  className="py-1.5 px-2 bg-sky-100 hover:bg-sky-200 text-sky-950 text-xs font-black rounded-xl border border-sky-700 shadow-[1.5px_1.5px_0px_#0284C7] flex items-center justify-center gap-1 transition-all active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                  title="Chỉnh sửa dàn ý, thụt lề Tab để chia nhánh nhỏ"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Dàn Ý</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredTopics.length === 0 && (
        <div className="bg-white p-8 rounded-2xl border-2 border-dashed border-[#141414]/30 text-center flex flex-col items-center justify-center gap-2">
          <BookOpen className="w-8 h-8 text-ink/30" />
          <p className="text-sm font-bold text-ink/60">Không tìm thấy chủ điểm nào phù hợp với bộ lọc hiện tại.</p>
          <button
            onClick={() => {
              setSelectedLevel('ALL');
              setSelectedCategory('ALL');
              setSearchQuery('');
              setStatusFilter('all');
            }}
            className="text-xs font-black text-amber-600 underline cursor-pointer mt-1"
          >
            Đặt lại tất cả bộ lọc
          </button>
        </div>
      )}

      {/* 4. TOPIC DETAIL MODAL DIALOG (AIO ENGLISH STYLE) */}
      <AnimatePresence>
        {selectedTopicForDetail && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-5 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-2xl bg-[#FFFDF7] rounded-[24px] border-[2.5px] border-[#141414] shadow-[6px_6px_0px_#141414] flex flex-col max-h-[90vh] overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 sm:p-5 border-b-2 border-dashed border-[#141414]/20 flex items-center justify-between gap-3 bg-amber-100/50">
                <div className="flex items-center gap-2.5">
                  <span
                    className="text-xs font-black px-2.5 py-1 rounded-lg border"
                    style={{
                      backgroundColor: LEVEL_THEMES[selectedTopicForDetail.level]?.badgeBg || '#10B981',
                      color: '#fff',
                      borderColor: '#141414'
                    }}
                  >
                    {selectedTopicForDetail.code}
                  </span>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-ink uppercase tracking-tight">
                      {selectedTopicForDetail.title}
                    </h3>
                    <p className="text-xs text-ink/65 font-bold">
                      {selectedTopicForDetail.vietnameseTitle} • {selectedTopicForDetail.category}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedTopicForDetail(null)}
                  className="p-1 text-ink/60 hover:text-ink rounded-lg hover:bg-black/5 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-4 sm:p-6 overflow-y-auto flex flex-col gap-5 text-ink">
                {/* Summary */}
                <div className="flex flex-col gap-1">
                  <h4 className="text-xs font-black uppercase tracking-wider text-ink/60">
                    Mô Tả Cốt Lõi:
                  </h4>
                  <p className="text-sm font-medium leading-relaxed bg-white p-3 rounded-xl border border-ink/15">
                    {selectedTopicForDetail.summary}
                  </p>
                </div>

                {/* Formulas List (mp-fml) */}
                {selectedTopicForDetail.formulas && selectedTopicForDetail.formulas.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <h4 className="text-xs font-black uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Công Thức Chuẩn (Formulas):
                    </h4>
                    <div className="bg-[#FAF8F5] rounded-xl border-2 border-[#141414] overflow-hidden divide-y divide-dashed divide-ink/15 shadow-sm font-mono text-xs font-bold">
                      {selectedTopicForDetail.formulas.map((fml, idx) => (
                        <div key={idx} className="p-2.5 sm:p-3 text-ink leading-relaxed">
                          {fml}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Examples (mp-ex) */}
                {selectedTopicForDetail.examples && selectedTopicForDetail.examples.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-ink/60">
                      Ví Dụ Minh Họa Song Ngữ:
                    </h4>
                    <div className="flex flex-col gap-2">
                      {selectedTopicForDetail.examples.map((ex, idx) => (
                        <div
                          key={idx}
                          className="bg-white p-3 rounded-xl border-l-4 border-l-amber-400 border border-ink/10 flex flex-col gap-1"
                        >
                          <p className="text-sm font-extrabold text-ink">{ex.en}</p>
                          <p className="text-xs font-medium text-ink/70 italic">{ex.vi}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Common Mistakes / Notes (mp-mis) */}
                {selectedTopicForDetail.commonMistakes && (
                  <div className="bg-amber-50/80 p-3.5 rounded-xl border-l-4 border-l-amber-500 border border-amber-200 flex flex-col gap-1 text-xs">
                    <span className="font-black text-amber-900 uppercase">⚠️ Lưu ý & Lỗi sai thường gặp:</span>
                    <p className="font-medium text-amber-950 leading-relaxed">
                      {selectedTopicForDetail.commonMistakes}
                    </p>
                  </div>
                )}

                {/* Mindmap Outline Preview */}
                <div className="flex flex-col gap-1.5">
                  <h4 className="text-xs font-black uppercase tracking-wider text-ink/60 flex items-center gap-1">
                    <Brain className="w-3.5 h-3.5 text-indigo-600" /> Cấu Trúc Sơ Đồ Tư Duy (Tỏa Tròn):
                  </h4>
                  <pre className="p-3 bg-gray-900 text-amber-200 rounded-xl font-mono text-xs overflow-x-auto leading-relaxed border border-black max-h-36">
                    {selectedTopicForDetail.mindmapOutline}
                  </pre>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-4 sm:p-5 border-t-2 border-dashed border-[#141414]/20 bg-gray-50 flex items-center justify-between gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleToggle(selectedTopicForDetail.id)}
                  className={cn(
                    'px-3 py-2 rounded-xl border-2 font-black text-xs transition-all flex items-center gap-1.5',
                    isCompleted(selectedTopicForDetail.id)
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-600'
                      : 'bg-white text-ink border-[#141414]'
                  )}
                >
                  {isCompleted(selectedTopicForDetail.id) ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 stroke-[3]" />
                      <span>Đã Nắm Vững</span>
                    </>
                  ) : (
                    <>
                      <Circle className="w-4 h-4 text-ink/40" />
                      <span>Đánh Dấu Đã Nắm</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const topic = selectedTopicForDetail;
                      setSelectedTopicForDetail(null);
                      onEditOutline(topic);
                    }}
                    className="px-3.5 py-2 bg-sky-100 hover:bg-sky-200 text-sky-950 text-xs font-black rounded-xl border-2 border-sky-700 shadow-[2px_2px_0px_#0284C7] flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Soạn Bài / Sửa Dàn Ý</span>
                  </button>

                  <button
                    onClick={() => {
                      const topic = selectedTopicForDetail;
                      setSelectedTopicForDetail(null);
                      onOpenMindmap(topic);
                    }}
                    className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-ink text-xs font-black uppercase rounded-xl border-2 border-[#141414] shadow-[2px_2px_0px_#141414] flex items-center gap-1.5"
                  >
                    <Brain className="w-4 h-4" />
                    <span>Mở Mindmap Tỏa Tròn</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
