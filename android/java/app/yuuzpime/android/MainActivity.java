package app.yuuzpime.android;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.res.Configuration;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.text.Editable;
import android.text.TextWatcher;
import android.util.LruCache;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowInsets;
import android.widget.*;
import org.json.*;
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.*;

public final class MainActivity extends Activity {
    // Native port of the Miru Web AniList catalog queries (MIT, Dovakiin0).
    private static final String API="https://graphql.anilist.co";
    private static final String FIELDS="id idMal title { romaji english } coverImage { medium large } format episodes status averageScore genres isAdult description externalLinks { site url }";
    private static final int BG=0xff101010, PANEL=0xff1b1b1b, MUTED=0xffaaaaaa, WHITE=0xfff5f5f5;
    private final ExecutorService network=Executors.newSingleThreadExecutor(), images=Executors.newFixedThreadPool(3);
    private final Handler ui=new Handler(Looper.getMainLooper());
    private final LruCache<String,Bitmap> covers=new LruCache<String,Bitmap>(12*1024*1024){
        @Override protected int sizeOf(String k,Bitmap v){return v.getByteCount();}
    };
    private final ArrayList<JSONObject> data=new ArrayList<>();
    private SharedPreferences prefs;
    private LinearLayout root,tabs;
    private GridView grid;
    private EditText search;
    private TextView status, heading;
    private Button next,prev;
    private ProgressBar loading;
    private CatalogAdapter adapter;
    private String tab="Trending", term="";
    private int page=1, generation=0;
    private boolean hasNext, dead=false;
    private Runnable debounce;
    private Future<?> active;

    private int dp(float x){return Math.round(x*getResources().getDisplayMetrics().density);}
    private GradientDrawable bg(int color,int radius){GradientDrawable d=new GradientDrawable();d.setColor(color);d.setCornerRadius(dp(radius));return d;}
    private TextView text(String s,int size,int color){TextView t=new TextView(this);t.setText(s);t.setTextSize(size);t.setTextColor(color);return t;}
    private Button btn(String s){Button b=new Button(this);b.setText(s);b.setTextColor(WHITE);b.setTextSize(12);b.setAllCaps(false);b.setMinHeight(dp(44));b.setBackground(bg(PANEL,12));return b;}
    private LinearLayout vertical(){LinearLayout l=new LinearLayout(this);l.setOrientation(LinearLayout.VERTICAL);return l;}
    private LinearLayout horizontal(){LinearLayout l=new LinearLayout(this);l.setOrientation(LinearLayout.HORIZONTAL);l.setGravity(Gravity.CENTER_VERTICAL);return l;}

    @Override public void onCreate(Bundle saved){
        super.onCreate(saved);
        prefs=getSharedPreferences("yuuzpime_native_v2",MODE_PRIVATE);
        getWindow().setStatusBarColor(BG);getWindow().setNavigationBarColor(BG);
        root=vertical();root.setBackgroundColor(BG);
        root.setPadding(dp(16),dp(8),dp(16),dp(8));
        setContentView(root);
        root.setOnApplyWindowInsetsListener((v,i)->{
            v.setPadding(dp(16)+i.getSystemWindowInsetLeft(),dp(8)+i.getSystemWindowInsetTop(),dp(16)+i.getSystemWindowInsetRight(),dp(8)+i.getSystemWindowInsetBottom());return i;
        });
        root.requestApplyInsets();
        LinearLayout header=horizontal();
        ImageView logo=new ImageView(this);logo.setImageResource(R.drawable.ic_yuuz);header.addView(logo,new LinearLayout.LayoutParams(dp(40),dp(40)));
        LinearLayout word=vertical();word.setPadding(dp(10),0,0,0);
        TextView name=text("YuuZPime",22,WHITE);name.setTypeface(null,Typeface.BOLD);word.addView(name);
        word.addView(text("NATIVE • GUEST MODE",10,MUTED));
        header.addView(word,new LinearLayout.LayoutParams(0,-2,1));
        Button about=btn("Info");about.setOnClickListener(v->new AlertDialog.Builder(this).setTitle("YuuZPime Android").setMessage("Modifikasi YuuZ. Katalog AniList, diadaptasi dari Miru Web (MIT, Dovakiin0). Tanpa login, iklan, atau Vercel. Pemutaran melalui penyedia resmi yang tersedia.").setPositiveButton("Tutup",null).setNeutralButton("SociaBuzz",(d,w)->open("https://sociabuzz.com/yuuzdisini")).show());
        header.addView(about,new LinearLayout.LayoutParams(dp(68),dp(44)));root.addView(header);
        search=new EditText(this);search.setSingleLine(true);search.setTextColor(WHITE);search.setHintTextColor(MUTED);search.setTextSize(15);search.setHint("Cari anime...");search.setPadding(dp(14),0,dp(14),0);search.setBackground(bg(PANEL,12));
        LinearLayout.LayoutParams sp=new LinearLayout.LayoutParams(-1,dp(48));sp.topMargin=dp(12);root.addView(search,sp);
        HorizontalScrollView scroll=new HorizontalScrollView(this);scroll.setHorizontalScrollBarEnabled(false);tabs=horizontal();scroll.addView(tabs);root.addView(scroll,new LinearLayout.LayoutParams(-1,dp(56)));refreshTabs();
        heading=text("Trending",18,WHITE);heading.setTypeface(null,Typeface.BOLD);root.addView(heading);
        status=text("",12,MUTED);status.setPadding(0,dp(4),0,dp(6));root.addView(status);
        loading=new ProgressBar(this,null,android.R.attr.progressBarStyleHorizontal);loading.setIndeterminate(true);root.addView(loading,new LinearLayout.LayoutParams(-1,dp(3)));
        grid=new GridView(this);grid.setNumColumns(GridView.AUTO_FIT);grid.setColumnWidth(dp(145));grid.setStretchMode(GridView.STRETCH_COLUMN_WIDTH);grid.setHorizontalSpacing(dp(10));grid.setVerticalSpacing(dp(12));grid.setClipToPadding(false);
        adapter=new CatalogAdapter();grid.setAdapter(adapter);grid.setOnItemClickListener((p,v,pos,id)->detail(data.get(pos)));root.addView(grid,new LinearLayout.LayoutParams(-1,0,1));
        LinearLayout nav=horizontal();prev=btn("Sebelumnya");next=btn("Selanjutnya");nav.addView(prev,new LinearLayout.LayoutParams(0,dp(44),1));View gap=new View(this);nav.addView(gap,new LinearLayout.LayoutParams(dp(8),1));nav.addView(next,new LinearLayout.LayoutParams(0,dp(44),1));root.addView(nav);
        prev.setOnClickListener(v->{if(page>1){page--;load();}});next.setOnClickListener(v->{if(hasNext){page++;load();}});
        search.addTextChangedListener(new TextWatcher(){
            public void beforeTextChanged(CharSequence s,int start,int count,int after){}
            public void onTextChanged(CharSequence s,int start,int before,int count){if(debounce!=null)ui.removeCallbacks(debounce);String q=s.toString().trim();debounce=()->{term=q;page=1;if(!term.isEmpty()&&tab.equals("Watchlist")){tab="Trending";refreshTabs();}load();};ui.postDelayed(debounce,650);}
            public void afterTextChanged(Editable s){}
        });
        load();
    }
    private void refreshTabs(){
        tabs.removeAllViews();
        for(String title:new String[]{"Trending","Popular","Airing","Upcoming","Watchlist"}){
            Button b=btn(title);if(tab.equals(title)){b.setBackground(bg(WHITE,12));b.setTextColor(BG);}
            LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(-2,dp(40));p.rightMargin=dp(8);tabs.addView(b,p);
            b.setOnClickListener(v->{tab=title;page=1;term="";if(debounce!=null)ui.removeCallbacks(debounce);if(search!=null)search.setText("");if(debounce!=null)ui.removeCallbacks(debounce);refreshTabs();load();});
        }
    }
    private boolean safe(JSONObject m){
        if(m==null||!m.has("isAdult")||m.optBoolean("isAdult",true))return false;
        JSONArray genres=m.optJSONArray("genres");if(genres!=null)for(int i=0;i<genres.length();i++){String g=genres.optString(i);if(g.equalsIgnoreCase("Hentai")||g.equalsIgnoreCase("Ecchi")||g.equalsIgnoreCase("Erotica"))return false;}
        return m.optInt("id",0)>0;
    }
    private JSONArray saved(){try{return new JSONArray(prefs.getString("watchlist","[]"));}catch(Exception e){return new JSONArray();}}
    private boolean savedId(int id){JSONArray a=saved();for(int i=0;i<a.length();i++){JSONObject x=a.optJSONObject(i);if(x!=null&&x.optInt("id")==id)return true;}return false;}
    private void toggle(JSONObject m){JSONArray a=saved(),b=new JSONArray();int id=m.optInt("id");boolean exists=false;for(int i=0;i<a.length();i++){JSONObject x=a.optJSONObject(i);if(x==null)continue;if(x.optInt("id")==id){exists=true;continue;}if(b.length()<99)b.put(x);}if(!exists)b.put(m);prefs.edit().putString("watchlist",b.toString()).apply();Toast.makeText(this,exists?"Dihapus dari watchlist":"Disimpan ke watchlist",Toast.LENGTH_SHORT).show();if(tab.equals("Watchlist"))load();}
    private void display(JSONArray items,boolean more,String label){data.clear();if(items!=null)for(int i=0;i<items.length();i++){JSONObject m=items.optJSONObject(i);if(safe(m))data.add(m);}hasNext=more;adapter.notifyDataSetChanged();grid.setSelection(0);loading.setVisibility(View.GONE);status.setText(label+" • "+data.size()+" judul");prev.setEnabled(page>1);next.setEnabled(hasNext);}
    private void load(){
        int token=++generation;if(active!=null)active.cancel(true);
        heading.setText(term.isEmpty()?tab:"Hasil pencarian");loading.setVisibility(View.VISIBLE);status.setText("Memuat katalog…");prev.setEnabled(false);next.setEnabled(false);
        if(tab.equals("Watchlist")){display(saved(),false,"Watchlist lokal");return;}
        String mode=tab,q=term;int p=page;
        String cacheKey="catalog:"+mode+":"+p+":"+q;
        active=network.submit(()->{
            try{
                String sort=mode.equals("Trending")?"TRENDING_DESC":"POPULARITY_DESC";
                String condition=mode.equals("Airing")?",status:RELEASING":mode.equals("Upcoming")?",status:NOT_YET_RELEASED":"";
                if(mode.equals("Airing"))sort="UPDATED_AT_DESC";
                if(!q.isEmpty()){sort="SEARCH_MATCH";condition="";}
                String query="query($page:Int,$search:String){Page(page:$page,perPage:18){pageInfo{hasNextPage} media(type:ANIME,isAdult:false,search:$search,sort:"+sort+condition+"){"+FIELDS+"}}}";
                JSONObject vars=new JSONObject().put("page",p);if(!q.isEmpty())vars.put("search",q);
                JSONObject payload=new JSONObject().put("query",query).put("variables",vars);
                JSONObject result=request(payload).getJSONObject("data").getJSONObject("Page");
                JSONArray filtered=new JSONArray();JSONArray list=result.getJSONArray("media");for(int i=0;i<list.length();i++){JSONObject m=list.optJSONObject(i);if(safe(m))filtered.put(m);}
                boolean more=result.getJSONObject("pageInfo").optBoolean("hasNextPage");
                JSONObject cached=new JSONObject().put("items",filtered).put("more",more);
                if(q.isEmpty()&&p<=3)prefs.edit().putString(cacheKey,cached.toString()).apply();
                ui.post(()->{if(!dead&&token==generation)display(filtered,more,"AniList • Halaman "+p);});
            }catch(Exception ex){
                ui.post(()->{if(dead||token!=generation)return;try{JSONObject old=new JSONObject(prefs.getString(cacheKey,""));display(old.getJSONArray("items"),old.optBoolean("more"),"Cache lokal");}catch(Exception e){display(new JSONArray(),false,"Koneksi/API bermasalah");status.setText("Katalog tidak tersedia. Ketuk di sini untuk mencoba lagi.");}status.setOnClickListener(v->load());});
            }
        });
    }
    private JSONObject request(JSONObject payload)throws Exception{
        HttpURLConnection c=(HttpURLConnection)new URL(API).openConnection();
        c.setConnectTimeout(7000);c.setReadTimeout(9000);c.setRequestMethod("POST");c.setRequestProperty("Content-Type","application/json");c.setRequestProperty("Accept","application/json");c.setDoOutput(true);
        try{try(OutputStream o=c.getOutputStream()){o.write(payload.toString().getBytes(StandardCharsets.UTF_8));}
            if(c.getResponseCode()!=200)throw new IOException("HTTP "+c.getResponseCode());
            try(InputStream i=c.getInputStream();ByteArrayOutputStream o=new ByteArrayOutputStream()){byte[] b=new byte[8192];int n;while((n=i.read(b))!=-1){if(o.size()+n>3000000)throw new IOException("Too large");o.write(b,0,n);}JSONObject j=new JSONObject(o.toString("UTF-8"));if(j.has("errors"))throw new IOException("API error");return j;}
        }finally{c.disconnect();}
    }
    private String title(JSONObject m){JSONObject t=m.optJSONObject("title");if(t==null)return "Anime";String e=t.optString("english","");return e.isEmpty()||e.equals("null")?t.optString("romaji","Anime"):e;}
    private String cover(JSONObject m){JSONObject c=m.optJSONObject("coverImage");return c==null?"":c.optString("medium","");}
    private String meta(JSONObject m){String ep=m.isNull("episodes")?"":m.optInt("episodes")+" eps";return m.optString("status","").replace('_',' ')+" · "+ep;}
    private void image(ImageView v,String url){
        v.setTag(url);v.setImageDrawable(null);v.setBackgroundColor(PANEL);Bitmap cached=covers.get(url);if(cached!=null){v.setImageBitmap(cached);return;}
        if(!url.startsWith("https://s4.anilist.co/")&&!url.startsWith("https://s3.anilist.co/")&&!url.startsWith("https://s.anilist.co/"))return;
        images.submit(()->{try{HttpURLConnection c=(HttpURLConnection)new URL(url).openConnection();c.setConnectTimeout(5000);c.setReadTimeout(7000);c.setInstanceFollowRedirects(false);try{if(c.getResponseCode()!=200)return;Bitmap b;try(InputStream i=c.getInputStream()){b=BitmapFactory.decodeStream(i);}if(b!=null){covers.put(url,b);ui.post(()->{if(!dead&&url.equals(v.getTag()))v.setImageBitmap(b);});}}finally{c.disconnect();}}catch(Exception ignored){}});
    }
    private final class CatalogAdapter extends BaseAdapter{
        public int getCount(){return data.size();}public Object getItem(int p){return data.get(p);}public long getItemId(int p){return data.get(p).optInt("id");}
        public View getView(int p,View convert,ViewGroup parent){
            LinearLayout card;ImageView img;TextView name,info;
            if(convert==null){card=vertical();card.setBackground(bg(PANEL,12));card.setPadding(dp(6),dp(6),dp(6),dp(8));img=new ImageView(MainActivity.this);img.setScaleType(ImageView.ScaleType.CENTER_CROP);card.addView(img,new LinearLayout.LayoutParams(-1,dp(190)));name=text("",14,WHITE);name.setTypeface(null,Typeface.BOLD);name.setMaxLines(2);name.setMinLines(2);name.setPadding(dp(4),dp(6),dp(4),0);card.addView(name);info=text("",10,MUTED);info.setSingleLine(true);info.setPadding(dp(4),0,dp(4),0);card.addView(info);}
            else{card=(LinearLayout)convert;img=(ImageView)card.getChildAt(0);name=(TextView)card.getChildAt(1);info=(TextView)card.getChildAt(2);}
            JSONObject m=data.get(p);name.setText(title(m));info.setText(meta(m));image(img,cover(m));return card;
        }
    }
    private void detail(JSONObject m){
        ScrollView scroll=new ScrollView(this);LinearLayout box=vertical();box.setPadding(dp(16),dp(10),dp(16),dp(16));scroll.addView(box);
        TextView info=text(meta(m),13,0xff666666);box.addView(info);
        String desc=m.optString("description","");if(desc.equals("null"))desc="";TextView description=text(android.text.Html.fromHtml(desc).toString(),14,0xff333333);description.setPadding(0,dp(8),0,dp(12));box.addView(description);
        JSONArray links=m.optJSONArray("externalLinks");int official=0;if(links!=null)for(int i=0;i<links.length();i++){JSONObject l=links.optJSONObject(i);if(l==null)continue;String url=l.optString("url"),site=l.optString("site");if(official(url)){Button b=btn("Tonton resmi • "+site);b.setOnClickListener(v->open(url));box.addView(b,new LinearLayout.LayoutParams(-1,dp(46)));official++;}}
        if(official==0)box.addView(text("Belum ada link penyedia resmi untuk judul ini.",13,0xff666666));
        new AlertDialog.Builder(this).setTitle(title(m)).setView(scroll).setPositiveButton("Tutup",null).setNeutralButton(savedId(m.optInt("id"))?"Hapus watchlist":"Simpan watchlist",(d,w)->toggle(m)).setNegativeButton("Info AniList",(d,w)->open("https://anilist.co/anime/"+m.optInt("id"))).show();
    }
    private boolean official(String url){try{Uri u=Uri.parse(url);String h=u.getHost();if(!"https".equals(u.getScheme())||h==null)return false;for(String d:new String[]{"crunchyroll.com","netflix.com","hidive.com","disneyplus.com","iq.com","bilibili.tv","primevideo.com"})if(h.equals(d)||h.endsWith("."+d))return true;}catch(Exception ignored){}return false;}
    private void open(String url){try{Uri u=Uri.parse(url);if("https".equals(u.getScheme()))startActivity(new Intent(Intent.ACTION_VIEW,u).addCategory(Intent.CATEGORY_BROWSABLE));}catch(Exception e){Toast.makeText(this,"Browser tidak tersedia",Toast.LENGTH_SHORT).show();}}
    @Override protected void onDestroy(){dead=true;if(active!=null)active.cancel(true);ui.removeCallbacksAndMessages(null);network.shutdownNow();images.shutdownNow();super.onDestroy();}
}
