pico-8 cartridge // http://www.pico-8.com
version 32
__lua__

cx,cy=0,0
dx,dy=1,0
distance=80
mv=distance
t=0
function _update()
 cx+=dx
 cy+=dy
 mv-=1
 if mv==0 then
  mv,dx,dy=distance,-dy,dx
 end
 t+=1
end

function _draw()
 cls()
 camera(cx,cy)
 pal()
 palt(0,false)
 map(34,1,0,0,26,26)
 draw_transparent(61,1,0,0,26,26)
end

function draw_transparent(mx,my,sx,sy,mw,mh)
 palt(11,true)
 for dx=0,mw-1 do
  for dy=0,mh-1 do
   local sprite=mget(mx+dx,my+dy)
   if transparent(sprite) then
    if moving(sprite) then
     if (t%10<5) sprite+=1
    end
    spr(sprite,sx+dx*8,sy+dy*8)
   end
  end
 end
end

trans={165,166,167,181,182,183}
function transparent(sprite)
 for t in all(trans) do
  if (t==sprite) return true
 end
 if sprite>=64 and sprite<=127 and sprite%16>=9 and sprite%16<=12 then
  return true
 end
 return moving(sprite)
end

function moving(sprite)
 if sprite<64 and sprite%16<8 then
  return true
 end
 return false
end
__gfx__
bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb22444422bbbbbbb22bbbbbbbbb5555bbbbbbbbbbbb5555bb
bbb00bbbbbb00bbbbbb000bbbbb000bbbbb00bbbbbb00bbbbbb00bbbbbb00bbbbbbbbbbbbbbbbbbb24244222bbbbb22e222bbbbbb57d7d5bbbb22bbbb57d7d5b
bb0440bbbb0440bbbb04440bbb04440bbb0440bbbb0440bbbb0440bbbb0440bbbbbbbbbbbbbbbbbb42442224bbb2277e24422bbb57000065bb2722bb57000065
bb0ff0bbbb0420bbbb024f0bbb024f0bb00ff0bbbb0ff00bb00420bbbb04200bbbb2222222221bbb44222244b2277e782424421b5d0000d1117e22115d0000d1
b0df950bb002200bb0d09f0bb0d09f0b0fdf950bb0df95f00fd2250bb0d225f0bb27eeeeeeee21bb42222424b27e78782422241b57111161d77e242d57111161
0fdd55f00fdd55f0b0fd550bb0fd550bb0dd5f0bb0fd550bb0dd5f0bb0fd550bb27e78888882221b22244244b2e8e8e82424241b15d655107e78244215d65510
b040040bb040040bbb04020bbb0040bbbb0400bbbb0040bbbb0400bbbb0040bb27e722222222212122424442b27888e82424241bb15511077ee824422155110b
bb0bb0bbbb0bb0bbbb00b00bbbb000bbbbb0bbbbbbbb0bbbbbb0bbbbbbbb0bbb277888888888821122242422b278e8e82424241bb11100177ee824242111001b
bb000bbbbb000bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb000bbbbb000bbb2782222222222821bbbbbbbbb278e8822222241bb1701517eee8242421d0151b
b04420bbb04420bbbb000bbbbb000bbbbb000bbbbb000bbbb04ff0bbb04ff0bb2888872288888881b3bbbbbbb2e882299222221bb1d01617e8e824242170161b
b042f00bb042f00bb0a940b0b0a9400bb04440bbb04440bbb0000000b000000021117e8211111111bbbbbbbbb2822ff77ff2221bb170151788e8242421d0151b
0d09f0400d09f040b094f007b094f07bb024f000b024f000b0245550b0245550b49411111420021bbbbbb3bbb21ff777777ff11bb1d01617e88e22242170161b
0fd554040fd554040d09f0400d09f40b0d09f0700d09f0700f4000000f400000b44490142220011bbbbbbbbbbb2f72277227f1bbb1111117e8e112222111111b
b0224200b02242000fd5540b0fd520bb0fd5570b0fd5570b000550bb000550bbb49490142422221bbbbbbbbbbb29724f900f91bbb57d7d57ee122122257d7d5b
0224440b0224440bb04020bbb0040bbbb04020bbb00400bbb04020bbbb040bbbb22290141111111bb3333b3bbb29724f999991bb570000651111111157000065
0214040b22004040b00b0bbbbb000bbbb00b0bbbbb000bbbb00b00bbbb000bbbbbbb2222bbbbbbbb32223333bb114224111111bb5d0000d17d7d7d7d5d0000d1
08200bbb08200bbbb070bbbbb070bbbbbb0e0bbbbb0e0bbbbbbbbbbbbbbbbbbbb222222bbbbbbbb3242444423bbbbbbbbbbbbbbb571111610000000057111161
b066d0bbb066d0bbb07000bbb07000bbb08000bbb08000bbbb000b0bbb000b0b15444451bbbbbbb3222242223abbbb3bbbbbbbbb15d655101111111115d65510
b065000bb065000bb070440bb070440bbb066d0bbb066d0bb0444040b044404016999961b3bbbb33423232323bbbbbbbbbbbbbbbb1551107565656565155110b
0706d0400706d040b0602f0bb0602f0bb0065000b0065000b024f002b024f00216944961bbbbb3322211222243bbbbbbbbbbbbbbb51100166dd77d555111001b
0dd004040dd0040404449f0b04449f0b0d506d070d506d070d0990020d09900215466451bbbbb3324343434343bbbbbb24442221b567d517d671051d516dd11b
b066d600b066d600b0f0dd0bb0f0dd0b0d5055700d5055700fd550020fd550021116d000bbbbbb324444444443abbbbb29994441b57d5d1665710d15517d151b
0224dd0b0224dd0bbb04020bbb0040bbb0060d0bb000600bb0402040b004004015221151bbb3bb323232323443abbbbb24222221b5d6d51555d1051111d6d11b
0214040b22004040bb00000bbbb000bbbb00b0bbbbb000bbb00b0b0bbb000b0b15211151bbbbbbb3222221123abb3bbb29444441bb1111bbb111111bbb1111bb
bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb222222b24444442334444332ab44ab222222221bbbb33bbb7bb7bbbbb7bbbbb
bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb0000bbbb0000bbbbbbbbbbbbbbbb1699996124b4b4b2ab3333abab33b31124444441bb33aa1bbb373bbbb7f7bb3b
bbbbb00bbbbbb00bbbbb02bbbbbb02bbb000e44eb000e44ebbb00000bbb000001546645142323232bbaabbbbb3123b3322222221b3a33b31bbb3bbebb373bbbb
bb000770bb000770b0b082bbb0b082bb044404200444042000b04a4200b04a42150650512b1b2b2bbbbbbbbb3ab3b311000000003abb3331bbbbbeaebb3bbcbb
b0776990b07769900200490b0200490b044404200444042009000940090009401000000143434343b3bbbbbb41313ab1122222203b313111bb7bbbebbbbbcacb
b0776990b0776990044420bb044420bb0422200b0422200bb0a9400bb0a9400011100000b4b4b4b4bbbbbbbba3b3bb332421124113130310b7f7bb3bb7bbbcbb
b076600bb076600bb04220bbb04220bb04ee442b04ee442bb094924b094492401522115132323234bbbbbb3b3313133124200241b1103103b373bbbbbb3bb3bb
b09090bb0920290bbb090bbbb09040bb0400402b0240042bb090924bb00009241521115122222112bbbbbbbb2121111211100111bb333333bb3bbbbbbbbbbbbb
ccccccccc76cc7cccccccc67ccccccccbbbbbbbbbbbbbbb555bbbb5555bbbbbbb31f95bbbbbbbbbbb31f93bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb1bbbbbbbbb
cccccccc6cccd5655555dccccc6ccc7cb3b3bb3bb3bbbb57ab3b55abb15bbb3b331f933b33333333b31f93bbbbbbb3333333bbbbb3bbbb100bb0b16003bbbbbb
ccccccccccddf35fffff955555c76cc6bb3bbbbbbbbbb5ab13357b313bb1bbbb341f954311111111b31f93bbbb3b311111133bbbbbb0017650170765503033bb
ccccccccc5ff33333333399ff5ccc5ccbbbbbbbbbbb55b3b311a3313b1311bbb301f9503fffffff9b31ff3bbb3b31ffffff333bbbb065065107650551006033b
ccccccccc5f33b3b333333333355590cbbbb3b3bbb5ab51331b131b3b13131bbf022220f9f99f999b31f93bbbb319f999f9f33bbb10551011105510110075033
cccccccccc53b3bbb3333b33333ff90dbbbbb3bbb573b111b31311113313110b0244440033333333b31f93bbb31ff93339ff93bb306011001060110000751103
cccccccc6c533bbb3bbbb3bbb333ff0db3bbbbbb5ab3bb31313113b131b11310d022220dbbbbbbbbb31ff3bbb31f933b319f93bb305000030050003300550033
cccccccccdf33bbbbb3bbbbb3b333f0dbbbbbbbb5b31331111b3111111331110c244440cbbbbbbbbb31f93bbb31f93bbb31f93bbb00033bb3000333b330033bb
ccccccccc5f333bbbbbbbbbbbb33395dbbbbbbbb5ab31b31b1311b31b1311310c0222207bbbbbbbbb31f93bbb31f93bb331ff3bbbbbbbbbbbbbbbbbbbbbbbbbb
ccccc6cc659333bbbbbbbbbbbb3390dcbb3bbbbb5b31b3313111b311311131105244440c33333333331f93b3b31f9333331f93bbbbb3bb11b3b1bb3bbbb0b0bb
cc76cccc75933b3bbbbbbbbbb3b3f0d6bbbbbbbbb1b3331313b311311bb31110f02222051111111111ff93bbb31fff1111ff93bbbbbbb1750b170bbbb317050b
ccccccccc5f333bbbbbbbbbbbb33f0d7bbbbbbbbbb1b3b313111b313b131310b3244440fffffffffff9ff3bbbb33fffffff93bbbb3bb1765107510bb3176500b
ccccc7ccc5f33b3bbbbbbbbbb33330dcbbbbbb3bbb513313b13131b3b13110bb302222039f99f999999f93bbbbb339f99f93bbbbbbb106511665010b3165510b
ccccccccc75f33bbbbbbbbbbbb333f5dbbbbbbbbb5abb331331311113313110b34000043339f9933319f93b3bbbb3333333bbbbbbb1760151010500b17151103
c7ccccccc6df33bbbbbbbbbb3b333f0db3bbbbbb57b3333131b11b3131b1110b30199103b31ff3bbb31ff3bbbbbbbbbbbbbbbbbbb17755050175050b31707503
cccccccccdf33bbbbbbbbbbbbb333f0dbbbbbbbb5a313113113311111133110b3319933bb31f93bbb31f93bbbbbbbbbbbbbbbbbb177555101761011017650103
ccccccccc5f333bbbbbbbbbbb3b3f0dcbbbbbbbb5bb33b31b1311b31b131100bbbbb3bbbb31f93bbb31f93bbb31f93bbbbbbbbbb165070101507605016651003
cc55cccc65ff3b3bbbbb3b3b3b3390d6bbbbb3bb51bbb1313111bb313111110bb94bb94b331f9333b31f933b11ff933bbbb00bbb050751065070651031101650
c550ccccc54ff333b3b33333339990dcbb3bb3bbb41b33111bb311111310101b2441244111f99911b31f9f11fff99f11bb0760bbb006507607610003b3170510
75006ccccc00f3333333333339000dccbbbbbbbbb3113313113133101110043bb22bb22bffffffffb31fffff999fffffb1065103bb0007657651103331765010
c776cccc6ccd0ffff333399ff900dcc6bbbbbbbbbbb311010000110000013bbb242124219f99f999b31f999933ff999930601103bbbb3001555510333165510b
ccccc50cc7ccd0000fff90000090dc7cb3bbbbbbb3bb0000411200004112bbbbb42bb42b33333333b31f9933b31f993330500033bbbb07500111033b17151103
ccc75506cccccdddd0055dddd000dc6cb3bbbb3bbbbb4123bbb14123bbbbbb3bbbbbbbbbbbbbbbbbb31ff33bb31ff33bb00033bbb3bbb00b300033bb31707503
cccc776cccc6cc6ccddddccccdddc6ccbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb3bbbbbbbb3bbb3b31f93bbb31f93bbbbbbbbbbbbbbbbbbb3333bbb17650103
b3bbbbbbbbbbbbbbbb33ff0fc5f3bbbbbbbbbbbbbb5555bbb33020202020203bbbb21bbbbbbbbbbbbbbbbbbbbbbbbbbbb31f93bbbbb33bbb1511015016651003
bbb33bbbbbb3bbbbbbb3f90c5f33bbbbb244442bb57b315b3332222222222033bbbf4bbb333bbbbbbbbbb333bb3bfbbbb31ff3bbbb3cccbb1155501031101650
bb3bb33bb3bbbbbbbb33f0d5f33b3bbbb499492b5ab131a11112424242424011b3b44bbb1113b3bbbb3b3111bb3fb3bbb31f93b3b3cc66cb15676500b3170510
b3b333333b3bb3bbbb33f059333bbbbbb244442b1b3313b3f9f24242424240ffbbb21bbbffff9fbbbbf9ffffb31ffbb3bb3f93bbb3cc66cb17111d0031761010
b3b333ff33bbbbbbb3b3ffff33b3bbbbb222222b11311b3099f2121212121099bbb21bbb999ffbfbbfbff999bb3f93bbb31ffbb3b33cccbb161005003165110b
bb333ff993b3bbbbbbb33ff3bb3bbb3bbbb42bbb301101033330101010101033bbbf4bbb33b3bfbbbbfb3b33b31f93b3bb3fb3bb3ccbb3bb1d100d0317151103
b3b33f90033bb3bbbb3b3333bbbbbbbbbbb42bbbb300002bbb3030d0c050313bbbb44b3bbbbbbbbbbbbbbbbbb31ff3bbbb3bfbbb3c6b3c6b1510050330300033
bb33390dd5933bbbbbb3bbbbbbbbbbbbbbbbbbbbbb4121bbbb33335dcc533bbbbbb21bbbb3bb3bbbbbb3bb3bb31f93bbbbbbbbbbb3bbb3bbb333333bb333333b
5555555555555555555555505555555555555550555555555610005055555555bbbbbbbbbbbbbbbbb00b000bb00b000bbbbbbbbbbbbbbbbbbbbbbbbbbbb1113b
5766777057667766776677705766776677667770776677667710007057667770bb110bbbbb110bbb042044f0042044f0bbbbbbbbbbbbbb3bbbbbbbbbb33aabbb
5711116057111111111111605711111111111160111111111110006057111160b17760b0b17760b00220499002204990bbb3bbbbbbbbbbbbbbbbbbbbababbbbb
5711116057111111111111605711111111111160111111111110006057111160b1775007b1775007b0204420b0204420bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
561000705610000000000070561000000000007000000000000000705610007022206070b2226070b024f990b024f990bbbbbbbbbb1111bbbbbbbbbbbb333bbb
56100070561000000000007056100000000000700000000000000070561000702427000bb242000bb0f02220b0f0220bbbbbbbbb1177aa113bbbbbbbb33240bb
5710006057776677667766705710007767100060661000776710006057776670020060bbb0200bbbbb00f090bb0b0f0bbbbbbb31a7aabaab133bbbbb324220bb
5710006011111111111111105710006017100060571000601710006011111110b10b00bbbb000bbbbbb00b00bbbb000bbbbbb31ababbabba3133bbbbb33330bb
5610007055555555561000705610007556100070561000755610007056100070bbbbbbbbbbbbbb66666bbbb666bbbbbbbbbb31aa23abbbb331033bbbb3111bbb
5610007077667766561000705610007677100070561000767710007677100076bbbbb67bbb6bb677777666677766bb76b3bb31ab23abbbb333103bbbbbbaa33b
5710006011111111571000605710001111100060571000111110001111100011bbbb677db6766777777777777777db6bbbbb317a13aabb33b3303b3bbbbbbaba
5710006011111111571000605710001111100060571000111110001111100011bbbbb6dbbb6677777777777776777dbbbbb317ab13abbb33b3303bbbbbbbbbbb
5610007000000000561000705610000000000070561000000000000000000000bb6bbbbbbbb6777777777767777776dbbbb31aba137abb34b31433bbbbb333bb
5610007000000000561000705610000000000070561000000000000000000000b677dbbbb667777776677777776776dbbbb321ab37abbb34330433bbbb04233b
5777667066776677571000605777667766776670571000776677667766100077bb6dbb7b67777767777766777667766dbbb321ab3abbbb32310233bbbb022423
1111111011111111571000601111111111111110571000611111111117100061bbbbbbbb67777777777777777777776dbbb3491abbbbb333310233bbbb03333b
d5ddd5ddd5ddd5dd15ddd5d015ddd5ddd5ddd5d0bbbbbbbbbb1110bbbb2222bbbbbbbbbb67777777777777767777776dbbbb344233bbb333324333bbbbbbbbbb
5555555555555555155555501555555555555550b222bbbbbb1420bbb277662bbbb66b6b67777777776777777767776dbbbb32424233329242233bbbbbbabbbb
ddd5ddd5ddd5ddd51dd5ddd01dd5ddd5ddd5ddd0277a2220bb16d0bb27444461bb67767667777677766776677667766dbbbb33229299424242333bbbb3ababb3
55555555555555551555555015555555555555502709aaa0b1676d0b2747d261b67777dbb677777777777777777776dbbbbbb333229442222333bbbb3ababb31
00000000000000000000000000000000000000002a99094028ee8820274d12d1b67676dbb677776777777777777766dbb3bbbb3312222211333bbbbb3aaab312
0000000033333333000000000000000000000000b000000028888820264222d1b677766db677766777767677776766dbbbbbbb333221113333bbb3bbaababbb1
01011011b3b3b3b3010110110101101101011011bbbbbbbbb022220bb166dd1bbbdd66dbb677777777667777777766dbbbbbbbb3333333333bbbbbbbabbbbbbb
111111113b3b3b3b111111111111111111111111bbbbbbbbbb0000bbbb1111bbbbbbddbbb677777767777776777776dbbbbbbbbbb33333bbbbbbbbbbbbbbbbbb
55151551bbbbbbbb1515155150000005155555d0b44444bbbbbbbb1bbbbbbbbb7777777667776777777777777777776dbbbbbbbbbbbbbbbbbbbb321a31033bbb
51151511bbbbbbbb111115110999444015122150479aa94bbbbbb170bb1001bb76777777d7777777777667777677666db3bbbb3333bbbb3bb3bb31aab3033bbb
11011110bbbbbbbb00051000922222241d0440d044a797a0bbbb176011600d1177777677bdd677677777776766766ddbbbbbb3929233bbbbbbbb1aabbb311bbb
15155515bbbbbbbb3301103322424221150f9050b4994990bbb1760b5717d16577777777bbbd6777766777777776dbbbbbb3329292423bbbbbb1aabbbbbaa1bb
151510150000b000bbb000bb46124221000f9000b447a40bb02760bb1dd11dd177677777bbbbd677777776677766db76bb334242224223bbb117abbbbbbbb31b
0111111155500055bbbbbbbb410222211109901147a994a0b0420bbbb1766d1b77777767b776d66777666666766dbb6bb3324222112221ab1aaababbbbbbbb31
5155155151155151bbbbbbbb222222211109401149900a9004000bbbb1dddd1b77767777b66bbd666666dddd66d76bbb33421233331122abababbbbbbb3bbbba
1111011011151111bbbbbbbb1111111111044011b00bb00b00bbbbbbb111111b67777776bbbbbbddddddbbbbddb6bbbb3321333bb333123bbbbbbbbbbbbbbbbb
__label__
bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb33395dcccccccccccccccccccccccccccccc
bbbbbbbbbbb3b3bb3bbbbbbbbbbbbbb3bbbb3bbbbbbbbbb3bbbb3bbbbbbbbbbbbbbbbbbbbbbb3bbbbbbbbbbbbbbb3390dccccccccccccccccccccccccccccccc
bbbbbbbbbbbb3bbbbbbbbbbbbbbb3bb3bbbbbbbbbbbb3bb3bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb3b3f0d6cccccccccccccccccccccccccccccc
bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb33f0d7cccccccccccccccccccccccccccccc
bbbbbbbbbbbbbb3b3bbbbbbbbbbbbbbbbbbbbbbb3bbbbbbbbbbbbbbb3bbbbbbbbbbbbbbbbbbbbbbb3bbbbbbbbbb33330dccccccccccccccccccccccccccccccc
bbbbbbbbbbbbbbb3bbbbbbbbbbb3bbbbbbbbbbbbbbb3bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb333f5dcccccccccccccccccccccccccccccc
bbbbbbbbbbb3bbbbbbbbbbbbbbb3bbbb3bb3bbbbbbb3bbbb3bb3bbbbbbbbbbbbbbbbbbbbbbb3bbbbbbbbbbbbbb3b333f0dcccccccccccccccccccccccccccccc
bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb333f0dcccccccccccccccccccccccccccccc
bbbbbbbbbbbbbbbbbbbbbbbbbb5555555555555555555555555555555555555550bbbbbbbbbbbbbbbbbb5555bbbb33395dcccccccccccccccccccccccccccccc
5bbb3bbbbbbbbbbbbbbbbbbbbb5766776677667766776677667766776677667770bbbbb3bbbbbbbbbbb57b315bbb3390dcccccccccccccccccccccc6cccccccc
a1bbbbbbbbbbbbbbbbbbbbbbbb5711111111111111111111111111111111111160bb3bb3bbbbbbbbbb5ab131a1b3b3f0d6cccccccccccccccccc76cccccccccc
b3bbbbbbbbbbbbbbbbbbbbbbbb5711111111111111111111111111111111111160bbbbbbbbbbbbbbbb1b3313b3bb33f0d7cccccccccccccccccccccccccccccc
30bbbbbb3bbbbbbbbbbbbbbbbb5610000000000000000000000000000000000070bbbbbbbbbbbbbbbb11311b30b33330dcccccccccccccccccccccc7cccccccc
03bbbbbbbbbbbbbbbbbbbbbbbb5610000000000000000000000000000000000070b3bbbbbbbbbbbbbb30110103bb333f5dcccccccccccccccccccccccccccccc
2bb3bbbbbbbbbbbbbbbbbbbbbb5710007766776677667766776677667767100060b3bbbb3bbbbbbbbbb300002b3b333f0dccccccccccccccccc7cccccccccccc
bbbbbbbbbbbbbbbbbbbbbbbbbb5710006011111111111111111111111117100060bbbbbbbbbbbbbbbbbb4121bbbb333f0dcccccccccccccccccccccccccccccc
bb5555555555555550bbbbbbbb56100070d5ddd5ddd5ddd5ddd5ddd5dd56100070bbbbbbbbbbbbbbbbbbbbbbbbbb33ff0fcccccccccccccccccccccccccccccc
bb5766776677667770bbbbbbbb5610007055555555555555555555555556100070bb3bbbbbbb3bbbbbbbbbb3bbbbb3f90ccc6ccc7ccccccccccccccccccccccc
bb5711111111111160bbbbbbbb57100060ddd5ddd5ddd5ddd5ddd5ddd557100060bbbbbbbbbbbbbbbbbb3bb3bbbb33f0d555c76cc6cccccccccccccccccccccc
bb5711111111111160bbbbbbbb5710006055555555555555555555555557100060bbbbbbbbbbbbbbbbbbbbbbbbbb33f059f5ccc5cccccccccccccccccccccccc
3b56100000000000700000b0005610007000000000000000000000000056100070bbbbbb3bbbbbbb3bbbbbbbbbb3b3ffff3355590ccccccccccccccccccccccc
bb5610000000000070555000555610007000000000000000000000000056100070bbbbbbbbbbbbbbbbb3bbbbbbbbb33ff3333ff90dcccccccccccccccccccccc
bb5710007766776670511551515710006001011011010110110101101157776670b3bbbbbbb3bbbbbbb3bbbb3bbb3b3333b333ff0dcccccccccccccccccccccc
bb5710006011111110111511115710006011111111111111111111111111111110bbbbbbbbbbbbbbbbbbbbbbbbbbb3bbbb3b333f0dcccccccccccccccccccccc
bb56100070d5ddd5d05515155156100070551515515511105155151551155555d0bbbbbbbbbb5555bbbbbbbbbbbbbbbbbbbb33395dcccccccccccccccccccccc
bb5610007055555550511515115610007051151511511420115115151115122150bb3bbbbbb57b315bbb3bbbbbbbbbbbbbbb3390dcccccccccccccccccccccc6
0b57100060ddd5ddd01101111057100060110111101116d010110111101d0440d0bbbbbbbb5ab131a1bbbbbbbbbbbbbbbbb3b3f0d6cccccccccccccccccc76cc
7b571000605555555015155515571000601515551511676d0515155515150f9050bbbbbbbb1b3313b3bbbbbbbbbbbbbbbbbb33f0d7cccccccccccccccccccccc
0b561000700000000015151015561000701515101528ee882015151015000f9000bbbbbb3b11311b30bbbbbb3bbbbbbbbbb33330dcccccccccccccccccccccc7
bb5610007000000000011111115610007001111111288888200111111111099011bbbbbbbb30110103bbbbbbbbbbbbbbbbbb333f5dcccccccccccccccccccccc
bb5777667001011011515515515710006051551551502222015155155111094011b3bbbbbbb300002bb3bbbbbbbbbbbbbb3b333f0dccccccccccccccccc7cccc
bb1111111011111111111101105710006011110110110000101111011011044011bbbbbbbbbb4121bbbbbbbbbbbbbbbbbbbb333f0dcccccccccccccccccccccc
bb155555d055151551551515115610007050000005555555555555555555555550bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb33395dcccccccccccccccccccccc
bb1512215051151511511511705610007009994440576677667766776677667770bb3bfbbbbbbbb3bbbbbbbbbbb3b3bb3bbb3390dccccccccccccccccccccccc
0b1d0440d011011110110117605710006092222224571111111111111111111160bb3fb3bbbb3bb3bbbbbbbbbbbb3bbbbbb3b3f0d6cccccccccccccccccccccc
40150f905015155515151176055710006022424221571111111111111111111160b31ffbb3bbbbbbbbbbbbbbbbbbbbbbbbbb33f0d7cccccccccccccccccccccc
04000f900015151015102760155610007046124221561000000000000000000070bb3f93bbbbbbbbbbbbbbbbbbbbbb3b3bb33330dccccccccccccccccccccccc
001109901101111111004201115610007041022221561000000000000000000070b31f93b3b3bbbbbbbbbbbbbbbbbbb3bbbb333f5dcccccccccccccccccccccc
0b1109401151551551040005515710006022222221571000776677667766776670b31ff3bbb3bbbb3bbbbbbbbbb3bbbbbb3b333f0dcccccccccccccccccccccc
401104401111110110001101105710006011111111571000601111111111111110b31f93bbbbbbbbbbbbbbbbbbbbbbbbbbbb333f0dcccccccccccccccccccccc
bb555555555444445154444451561000705515155156100070d5ddd5ddd5ddd5ddb31f93bbbbbbbbbbb222222bbbbbbbbbbb33ff0fcccccccccccccccccccccc
bb57667770479aa941479aa9415610007051151511561000705555555555555555b31f93bbbb3bbbbb15444451bb3bbbbbbbb3f90ccc6ccc7cccccccccccccc6
0b5711116044a797a044a797a0571000601101111057100060ddd5ddd5ddd5ddd5b31f93bbbbbbbbbb16999961bbbbbbbbbb33f0d555c76cc6cccccccccc76cc
005711116014994990149949905710006015155515571000605555555555555555b31ff3bbbbbbbbbb16944961bbbbbbbbbb33f059f5ccc5cccccccccccccccc
07561000701447a4051447a4055610007015151015561000700000000000000000b31f93bbbbbbbb3b15466451bbbbbb3bb3b3ffff3355590cccccccccccccc7
705610007047a994a047a994a05610007001111111561000703333333333333333b31f93bbbbbbbbbb1116d000bbbbbbbbbbb33ff3333ff90dcccccccccccccc
0b5710006049900a9049900a90571000605155155157100060b3b3b3b3b3b3b3b3b31ff3bbb3bbbbbb15221151b3bbbbbbbb3b3333b333ff0dccccccccc7cccc
bb5710006010010000100100005710006011110110571000603b3b3b3b3b3b3b3bb31f93bbbbbbbbbb15211151bbbbbbbbbbb3bbbb3b333f0dcccccccccccccc
bb561000755555555055151551561000755555555556100070bbbbbbbbbbbbbbbbb31f93bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb33395dcccccccccccccc
bb561000767766777051151511561000767766776677100070bb3bbbbbbb3bbbbbb31f93333333333333333333333333333333bbbbbb3390dccccccccccc55cc
0b571000111111116011011110571000111111111111100060bbbbbbbbbbbbbbbbb31fff1111111111111111111111111111133bbbb3b3f0d6ccccccccc550cc
0b571000111111116015155515571000111111111111100060bbbbbbbbbbbbbbbbbb33fffffffffff9fffffff9fffffff9fff333bbbb33f0d7cccccccc75006c
0b561000000000007015151015561000000000000000000070bbbbbb3bbbbbbb3bbbb339f99f99f9999f99f9999f99f9999f9f33bbb33330dcccccccccc776cc
0b561000000000007001111111561000000000000000000070bbbbbbbbbbbbbbbbbbbb333333333333333333333333333339ff93bbbb333f5dccccccccccccc5
3b577766776677667051551551577766776677667766776670b3bbbbbbb3bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb319f93bb3b333f0dccccccccccc755
bb111111111111111011110110111111111111111111111110bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb31f93bbbb333f0dcccccccccccc77
bbd5ddd5ddd5ddd5dd15151551d5ddd5ddd5ddd5ddd5ddd5ddbb5555bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb31f93bbbb33ff0fccccccccc76cc7
bb555555555555555511111511555555555555555555555555b57b315bbbbbb3bbbbbbbbbbb3b3bb3bbb3bbbbbbbbbbbbbb31f93bbbbb3f90ccc6ccc7c6cccd5
bbddd5ddd5ddd5ddd500051000ddd5ddd5ddd5ddd5ddd5ddd55ab131a1bb3bb3bbbbbbbbbbbb3bbbbbbbbbbbbbbbbbbbbbb31f93bbbb33f0d555c76cc6ccddf3
bb5555555555555555330110335555555555555555555555551b3313b3bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb31ff3bbbb33f059f5ccc5ccc5ff33
3b0000000000000000bbb000bb00000000000000000000000011311b30bbbbbbbbbbbbbbbbbbbb3b3bbbbbbb3bbbbbbbbbb31f93bbb3b3ffff3355590cc5f33b
bb3333333333333333bbbbbbbb33333333333333333333333330110103b3bbbbbbbbbbbbbbbbbbb3bbbbbbbbbbbbbbbbbbb31f93bbbbb33ff3333ff90dcc53b3
bbb3b3b3b3b3b3b3b3bbbbbbbbb3b3b3b3b3b3b3b3b3b3b3b3b300002bb3bbbb3bbbbbbbbbb3bbbbbbb3bbbbbbbbbbbbbbb31ff3bbbb3b3333b333ff0d6c533b
bb3b3b3b3b3b3b3b3bbbbbbbbb3b3b3b3b3b3b3b3b3b3b3b3bbb4121bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb31f93bbbbb3bbbb3b333f0dcdf33b
bbbbbbbbbbbbbbbbbbbb5555bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb5555bbbbbbbbbbbbbbbbbbb31f93bbbbbbbbbbbb33395dc5f333
3bbbbbbbbbbb3bbbbbb57b315bb3b3bb3bbb3bbbbbbbbbb3bbbb3bbbbbbbbbbbbbb3b3bb3bb57b315bbbbbb3bbbbbbb3bbb31f93bbbb3bbbbbbb3390dc65ff3b
bbbbbbbbbbbbbbbbbb5ab131a1bb3bbbbbbbbbbbbbbb3bb3bbbbbbbbbbbbbbbbbbbb3bbbbb5ab131a1bb3bb3bbbb3bb3bbb31f93bbbbbbbbbbb3b3f0d6c54ff3
bbbbbbbbbbbbbbbbbb1b3313b3bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb1b3313b3bbbbbbbbbbbbbbbbb31ff3bbbbbbbbbbbb33f0d7cc00f3
3bbbbbbbbbbbbbbb3b11311b30bbbb3b3bbbbbbb3bbbbbbbbbbbbbbb3bbbbbbbbbbbbb3b3b11311b30bbbbbbbbbbbbbbbbb31f93bbbbbbbb3bb33330dc6ccd0f
bbbbbbbbbbbbbbbbbb30110103bbbbb3bbbbbbbbbbb3bbbbbbbbbbbbbbbbbbbbbbbbbbb3bb30110103b3bbbbbbb3bbbbbbb31f93bbbbbbbbbbbb333f5dc7ccd0
bbbbbbbbbbb3bbbbbbb300002bb3bbbbbbb3bbbbbbb3bbbb3bb3bbbbbbbbbbbbbbb3bbbbbbb300002bb3bbbb3bb3bbbb3bb31ff3bbb3bbbbbb3b333f0dcccccd
bbbbbbbbbbbbbbbbbbbb4121bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb4121bbbbbbbbbbbbbbbbbbb31f93bbbbbbbbbbbb333f0dccc6cc
bbbbbb3bbbbbbb3bbbbbbb3bbbbbbb3bbbbbbb3bbbbbbb3bbbbbbbbbbbbbbb3bbbbbbb3bbbbbbb3bbbbbbbbbb22bbbbbbbb31f93bbbbbb33bbbb33395dcccccc
bbb94bb94bb94bb94bb94bb94bb94bb94bb94bb94bb94bb94bbbbbbbbbb94bb94bb94bb94bb94bb94bbbbbb22e222bbbbbb31f93bbbb33aa1bbb3390dccccccc
bb244124412441244124412441244124412441244124412441bbbbbbbb244124412441244124412441bbb2277e24422bbbb31f93bbb3a33b31b3b3f0d6cccccc
bbb22bb22bb22bb22bb22bb22bb22bb22bb22bb22bb22bb22bbbbbbbbbb22bb22bb22bb22bb22bb22bb2277e782424421bb31ff3bb3abb3331bb33f0d7cccccc
bb242124212421242124212421242124212421242124212421bbbbbbbb242124212421242124212421b27e78782422241bb31f93bb3b313111b33330dccccccc
bbb42bb42bb42bb42bb42bb42bb42bb42bb42bb42bb42bb42bbbbbbbbbb42bb42bb42bb42bb42bb42bb2e8e8e82424241bb31f93bb13130310bb333f5dcccccc
bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb27888e82424241bb31ff3bbb11031033b333f0dcccccc
bbbb3bbbbbbb3bbbbbbb3bbbbbbb3bbbbbbb3bbbbbbb3bbbbbbbbbbbbbbb3bbbbbbb3bbbbbbb3bbbbbb278e8e82424241bb31f93bbbb333333bb333f0dcccccc
bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb21bbbbbbbbbbbbbbbbbbbbbbbbbbbb278e8822222241bb31f93bbbbbbbbbbbb33ff0fcccccc
bbb3b3bb3bb3bbbbbbb3bbbbbbb3bbbbbbbbbbbbbbbb3bbbbbbbbf4bbbbbbbb3bbbbbb0000bb3bbbbbb2e882299222221bb31f93bbbb3bbbbbbbb3f90c5555dc
bbbb3bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb3b44bbbbb3bb3bbb000e44ebbbbbbbbb2822ff77ff2221bb31f93bbbbbbbbbbbb33f0d5ffff95
bbbbbbbbbbbbbbb3bbbbbbb3bbbbbbb3bbbbbbbbbbbbbbbbbbbbb21bbbbbbbbbbb04440420bbbbbbbbb21ff777777ff11bb31ff3bbbbbbbbbbbb33f059333339
bbbbbb3b3bbbbbbbbbbbbbbbbbbbbbbbbb24442221bbbbbb3bbbb21bbbbbbbbbbb04440420bbbbbb3bbb2f72277227f1bbb31f93bbbbbbbb3bb3b3ffff333333
bbbbbbb3bbbbbbbbbbbbbbbbbbbbbbbbbb29994441bbbbbbbbbbbf4bbbb3bbbbbb0422200bbbbbbbbbbb29724f900f91bbb31f93bbbbbbbbbbbbb33ff3b3333b
3bb3bbbbbbb3333b3bb3333b3bb3333b3b24222221b3bbbbbbbbb44b3bb3bbbb3b04ee442bb3bbbbbbbb29724f999991bbb31ff3bbb3bbbbbbbb3b33333bbbb3
bbbbbbbbbb32223333322233333222333329444441bbbbbbbbbbb21bbbbbbbbbbb0240042bbbbbbbbbbb114224111111bbb31f93bbbbbbbbbbbbb3bbbbbb3bbb
bbbbbbbbb3242444422ab44ab224444442222222213bbbbbbbbbb21bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb21bbbb31f93bbbbbbbbbbbbbbbbbbbbbbbb
bbbbbbbbb322224222ab33b31124b4b4b2244444413abbbb3bbbbf4bbbb3b3bb3bbbbbbbbbb3b3bb3bbb3bbbbbbbbf4bbbb31f93bbbbbbb3bbb3b3bb3bbbbbb3
bbb3bbbb3342323232b3123b3342323232222222213bbbbbbbb3b44bbbbb3bbbbbbbbbbbbbbb3bbbbbbbbbbbbbb3b44bbbb31f93bbbb3bb3bbbb3bbbbbbb3bb3
bbbbbbb332221122223ab3b3112b1b2b2b0000000043bbbbbbbbb21bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb21bbbb31ff3bbbbbbbbbbbbbbbbbbbbbbbb
bbbbbbb3324343434341313ab1434343431222222043bbbbbbbbb21bbbbbbb3b3bbbbbbbbbbbbb3b3bbbbbbb3bbbb21bbbb31f93bbbbbbbbbbbbbb3b3bbbbbbb
bbbbbbbb3244444444a3b3bb33b4b4b4b42421124143abbbbbbbbf4bbbbbbbb3bbbbbbbbbbbbbbb3bbbbbbbbbbbbbf4bbbb31f93bbb3bbbbbbbbbbb3bbb3bbbb
3bbbb3bb323232323433131331323232342420024143abbbbbbbb44b3bb3bbbbbbbbbbbbbbb3bbbbbbb3bbbbbbbbb44b3bb31ff3bbb3bbbb3bb3bbbbbbb3bbbb
bbbbbbbbb3222221122121111222222112111001113abb3bbbbbb21bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb21bbbb31f93bbbbbbbbbbbbbbbbbbbbbbbb
bbbbbbbbb3242444422ab44ab224444442244444423bbbbbbbbbb21bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb21bbbb31f93bbbbbbbbbbbbbbbbbbbbbbbb
bbbbb000b322224222ab33b31124b4b4b224b4b4b23ab00b3bbbbf4bbbbbbbbbbbbbbbb3bbbbbbbbbbbb3bbbbbbbbf4bbbb31f933b3333333333333333333333
bbb304440342323232b3123b3342323232423232323b0440bbb3b44bbbbbbb02bbbb3bb3bbbbbbb00bbbbbbbbbb3b44bbbb31f9f111111111111111111111111
bbbb024f02221122223ab3b3112b1b2b2b2b1b2b2b430ff00bbbb21bbbb0b082bbbbbbbbbbbb000770bbbbbbbbbbb21bbbb31ffffffffffff9fffffff9ffffff
bbb0d09f024343434341313ab1434343434343434340df95f0bbb21bbb0200490bbbbbbbbbb0776990bbbbbb3bbbb21bbbb31f99999f99f9999f99f9999f99f9
bbb0fd550244444444a3b3bb33b4b4b4b4b4b4b4b440fd550bbbbf4bbb044420bbb3bbbbbbb0776990bbbbbbbbbbbf4bbbb31f99333333333333333333339f99
3bbb00403232323234331313313232323432323234430040bbbbb44b3bb04220bbb3bbbb3bb076600bb3bbbbbbbbb44b3bb31ff33bbbbbbbbbbbbbbbbbb31ff3
bbbbb000b3222221122121111222222112222221123abb0bbbbbb21bbbb09040bbbbbbbbbb0920290bbbbbbbbbbbb21bbbb31f93bbbbbbbbbbbbbbbbbbb31f93
bbbbbbbbb3244444422ab44ab22ab44ab22ab44ab23bbbbbbbbbb21bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb21bbbb31f93bbbbbbbbbbbbbbbb66631f93
bbbbbbbbb324b4b4b2ab33b311ab33b311ab33b3113abbbb3bbbbf4bbbbbbbbbbbbbbbbbbbbbbbbbbbb3b3bb3bbbbf4bbbb31ff3bbbbbbb67bbb6bb677731f93
bbb3bbbb3342323232b3123b33b3123b33b3123b333bbbbbbbb3b44bbbbbbbbbbbbbbb02bbbbbb02bbbb3bbbbbb3b44bbbb31f93b3bbbb677db6766777731f93
bbbbbbb3322b1b2b2b3ab3b3113ab3b3113ab3b31143bbbbbbbbb21bbbbbbbbbbbb0b082bbb0b082bbbbbbbbbbbbb21bbbbb3f93bbbbbbb6dbbb667777731ff3
bbbbbbb3324343434341313ab141313ab141313ab143bbbbbbbbb21bbbbbbbbbbb0200490b0200490bbbbb3b3bbbb21bbbb31ffbb3bb6bbbbbbbb67777731f93
bbbbbbbb32b4b4b4b4a3b3bb33a3b3bb33a3b3bb3343abbbbbbbbf4bbbbbbbbbbb044420bb044420bbbbbbb3bbbbbf4bbbbb3fb3bbb677dbbbb6677777731f93
3bbbb3bb323232323433131331331313313313133143abbbbbbbb44b3bbbbbbbbbb04220bbb04220bbb3bbbbbbbbb44b3bbb3bfbbbbb6dbb7b67777767731ff3
bbbbbbbbb3222221122121111221211112212111123abb3bbbbbb21bbbbbbbbbbbb09040bbb09040bbbbbbbbbbbbb21bbbbbbbbbbbbbbbbbbb67777777731f93
bbbbbbbbb3242444422444444224244442244444423bbbbbbbbbb21bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb21bbbbbbbbbbbbbbbbb6677777776731f93
bbbbbbbbb32222422224b4b4b22222422224b4b4b23abbbb3bbbbf4bbbbbbbbbbbbbbbbbbbb3b3bb3bbbbbbbbbbbbf4bbbbbbbbbbbbb6bb67777677777731f93
bbb3bbbb33423232324232323242323232423232323bbbbbbbb3b44bbbbbbbbbbbbbbb02bbbb3bbbbbbbb00000b3b44bbbbbbbbbbbb676677776677667731f93
bbbbbbb332221122222b1b2b2b221122222b1b2b2b43bbbbbbbbb21bbbbbbbbbbbb0b082bbbbbbbbbb00b04a42bbb21bbbbbbbbbbbbb66777777777777731ff3
bbbbbbb3324343434343434343434343434343434343bbbbbbbbb21bbbbbbbbbbb0200490bbbbb3b3b09000940bbb21bbbbbbbbbbbbbb6777777777777731f93
bbbbbbbb3244444444b4b4b4b444444444b4b4b4b443abbbbbbbbf4bbbbbbbbbbb044420bbbbbbb3bbb0a94000bbbf4bbbbbbbbbbbb667777777767677731f93
3bbbb3bb323232323432323234323232343232323443abbbbbbbb44b3bbbbbbbbbb04220bbb3bbbbbb09449240bbb44b3bbbbbbbbb6777776777667777731ff3
bbbbbbbbb3222221122222211222222112222221123abb3bbbbbb21bbbbbbbbbbbb09040bbbbbbbbbbb0000924bbb21bbbbbbbbbbb6777777767777776631f93
bbbbbbbbbb33444433334444333344443333444433bbbbbbbbbbbbbbbbbb5555bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb6777777777777776731f93
bbbb3bbbbbab3333abab3333abab3333abab3003abb3b3bb3bbb3bbbbbb57b315bbb3bbbbbbbbbb3bbb3b3bb3bbbbbbbbbbbbbb3bb6777777776777777731f93
bbbbbbbbbbbbaabbbbbbaabbbbbbaabbbbbb0440bbbb3bbbbbbbbbbbbb5ab131a1bbbbbbbbbb3bb3bbbb3bbbbbbbbbbbbbbb3bb3bb6777767777777677731f93
bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb04200bbbbbbbbbbbbbbbbb1b3313b3bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb677777777777777731ff3
bbbbbbbb3bb3bbbbbbb3bbbbbbb3bbbbbbb0d225f0bbbb3b3bbbbbbb3b11311b30bbbbbb3bbbbbbbbbbbbb3b3bbbbbbbbbbbbbbbbbb677776777677777731f93
bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb0fd550bbbbbb3bbbbbbbbbb30110103bbbbbbbbb3bbbbbbbbbbb3bbbbbbbbbbb3bbbbbbb677766777777767731f93
bbb3bbbbbbbbbbbb3bbbbbbb3bbbbbbb3bbb00403bb3bbbbbbb3bbbbbbb300002bb3bbbbbbb3bbbb3bb3bbbbbbbbbbbbbbb3bbbb3bb677777777767777731ff3
bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb0bbbbbbbbbbbbbbbbbbbbb4121bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb677777767777776631f93

__map__
4040404050404060505144644a64544500000000445245474454525454446454540000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
4040414243414340405154644a45465600000000544556564764525454757677540052544452524452645464545252545253404040405040504040400040404040404040404040404040404040404040404040404040400000000000000000000000000000000000000000000000000000000000000000000000000000000000
40505164727353404173524b5c65565600000000645556565646475444777776440054446475545252839191918464527553404050404040504040500040404040404040839191918464527553404050404040504040500000000000000000000000000000000000000000000000000000000000000000000000000000000000
4040514445477243510b0c4a52545556000000005455565656565775546868685400525254548382b192a0a0a090545464724340404040504050404000525254548382b192a0a0a09054546472434040404050405040400000000000000000000000000000000000000000000000000000000000000000000000000000000000
5040617165677553511b1c4a54455656000000007565565656566752545d4f6454004454445290a4b092b0b0b0b45475545253404050404040405040005244541290a4b092b0a6b0b454755452534040504040404050400000000000000000000000000000000000000000000000000000000000000000000000000000000000
40404061717a4c5351444b5c54555656000000005254656666677564447f5d5e440064646454b4b0b092b38391827b645244534040405040504040400052261020b4b0b692b38391827b645244534040405040504040400000000000000000000000000000000000000000000000000000000000000000000000000000000000
4060504051645b7d7e495a444465666600000000544b79647b5444544d4e6f6f54005264445280b0b092b092a1a14a54285472434050414242424350005226222480b5b592b092a1a14a542854724340504142424243500000000000000000000000000000000000000000000000000000000000000000000000000000000000
404040505164445351546a4c6468686800000000544a52646a494c645d4e6e7f5400526452649382b093919454545b4949494c534060510d0e0f536000521664229382b093919454545b4949494c534060510d0e0f53600000000000000000000000000000000000000000000000000000000000000000000000000000000000
504040406162626351445b69494949490000000049695949694c7c546d4f4d4f5400526c5254a1a1b2a1a1a17564524454524a724341731d1e1f536000526c5254a1a1b2a1a1a17564524454524a724341731d1e1f53600000000000000000000000000000000000000000000000000000000000000000000000000000000000
404142435041424273545264544454540000000064546a797a6b7964545454647400645264445254754454645452447564644a545361712d2e2f535000645264445254754454645452447564644a545361712d2e2f53500000000000000000000000000000000000000000000000000000000000000000000000000000000000
417364724273445454645d5e4d5e64540000000054525b49495c545464644454540054447552686868686868526868680b0c4a3d53406162486263400054447552686868686868526868680b0c4a3d53406162486263400000000000000000000000000000000000000000000000000000000000000000000000000000000000
735454858064549c54446d6e5f6d4f4400000000000000000000000000000000000052644478441a1a1a2c54786452541b1c4a5472424242584350400052644478441a1a1a2c54786434541b1c4a5472424242584350400000000000000000000000000000000000000000000000000000000000000000000000000000000000
645454809444549c544d4e4f6d5e544400000000000000000000000000000000000054546478292a3b393c2b7844524454784a6444643d644a5340400054886478292a3b393c2b7844524454784a6444643d644a5340400000000000000000000000000000000000000000000000000000000000000000000000000000000000
445464858464544464544454547f445400000000000000000000000000000000000064524478292a3b39392b7852645254786a49494949495c7243400064885478022a3b3939047832643054786a49495949495c7243400000000000000000000000000000000000000000000000000000000000000000000000000000000000
546454545264545252545252645454540000000000000000000000000000000000004454647829393b3b3b2b7852525244787c98999a9a9b526c5340004488647829393b3b3b2b7852323244787c98994a9a9b526c53400000000000000000000000000000000000000000000000000000000000000000000000000000000000
526452445464525244545454545254640000000000000000000000000000000000006c645478292a392a392b7852524452785299aab8aaab98525340006c645478292a392a392b7852324436785299aa4aaaab985253400000000000000000000000000000000000000000000000000000000000000000000000000000000000
0000000000000000000000000000000000000000000000000000000000000000000054544452543a3a3a3a4454755464445264a9b8aababb987063400054544452543a3a3a064454755464445264a9b84ababb987063400000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000545454546464548c8d8d8e648c8d8e5464b9babb52a86472434000545454546464548c8d8d8e648c8d8e5464b9ba4a52a8647243400000000000000000000000000000000000000000000000000000000000000000000000000000000000
000000000000000000000000000000000000000000000000000000000000000000006454758c8daf8dbe5252bf8dbe529f52545298524464526c7242006454758c8daf8dbe5252bf8dbe529f525452984a4464526c72420000000000000000000000000000000000000000000000000000000000000000000000000000000000
000000000000000000000000000000000000000000000000000000000000000000005454549c52524d4f5474525452bcae54756454447a4c6c4d4f4d005454549c52524d4f5474525452bcae547564545b494c6c4d4f4d0000000000000000000000000000000000000000000000000000000000000000000000000000000000
000000000000000000000000000000000000000000000000000000000000000000009844548f5254524452525252bcae645452541a1a444a5d4e4e4e009844548f5254524452525252bcae645452541a1a444a5d4e4e4e0000000000000000000000000000000000000000000000000000000000000000000000000000000000
000000000000000000000000000000000000000000000000000000000000000000009b9844acbd52645252bcadadae443e3f44290a0a2b4a6f5d4f5f009b9844acbd52645252bcadadae443e3f44290a0a2b4a6f5d4f5f0000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000aa9b5454acad9dadadae64646c643f3e44290a0a2b4a6d7e5d6e00aa9b5454acad9dadadae64646c643f3e44290a0a2b4a6d7e5d6e0000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000b8ab984454545264446454545444647554443a3a445b495c7f4d00b8ab984454545264446454545444647554443a3a445b495c7f4d0000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000b8aa9ba898999a9a9a9b64a85244643d753d75753d839191919100b8aa9ba898999a9a9a9b64a85244643d753d75753d83919191910000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000b8b8aa9a9aaab8b8aaaa9a9a9b986454547583919194a1a1a1a100b8b8aa9a9aaa14b8aaaa9a9a9b986454547583919194a1a1a1a10000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000b8b8aab8aab8b8b8aab8b8b8aa9a9ba8443d92a1a1a13e3f3f3e00b8b82020aa1614b8aab8b8b8aa9a9ba8443d92a1a1a13e3f3f3e0000000000000000000000000000000000000000000000000000000000000000000000000000000000
